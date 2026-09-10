import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL("../supabase/postgame-feedback-migration.sql", import.meta.url);
const schemaPath = new URL("../supabase/schema.sql", import.meta.url);

const [migrationSql, schemaSql] = await Promise.all([
  readFile(migrationPath, "utf8"),
  readFile(schemaPath, "utf8"),
]);

// These tests are structural contract checks: they inspect committed SQL without
// executing PostgreSQL. A live Supabase integration run is still required to prove
// migration execution, RLS decisions for real JWT roles, concurrency, rollback,
// PostgREST discovery, and RPC behavior against actual rows.

function normalized(sql) {
  return sql.replaceAll("\r\n", "\n").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertMatches(sql, pattern, message) {
  assert.match(normalized(sql), pattern, message);
}

function functionDefinition(sql, qualifiedName) {
  const startPattern = new RegExp(
    `create\\s+or\\s+replace\\s+function\\s+${escapeRegExp(qualifiedName)}\\s*\\(`,
    "i",
  );
  const start = sql.search(startPattern);
  assert.notEqual(start, -1, `missing function ${qualifiedName}`);

  const end = sql.indexOf("$function$;", start);
  assert.notEqual(end, -1, `unterminated function ${qualifiedName}`);
  return sql.slice(start, end + "$function$;".length);
}

function policyDefinition(sql, policyName, tableName) {
  const pattern = new RegExp(
    `create\\s+policy\\s+"${escapeRegExp(policyName)}"[\\s\\S]*?on\\s+${escapeRegExp(tableName)}[\\s\\S]*?;`,
    "i",
  );
  const match = normalized(sql).match(pattern);
  assert.ok(match, `missing policy ${policyName}`);
  return match[0];
}

test("canonical schema ends with the standalone postgame migration", () => {
  assert.ok(
    normalized(schemaSql).endsWith(normalized(migrationSql)),
    "schema.sql must contain the exact final migration definitions as its suffix",
  );
});

test("feedback and rollout tables enforce the required shape", () => {
  assertMatches(migrationSql, /create table if not exists public\.game_feedback\s*\([\s\S]*?id uuid primary key default gen_random_uuid\(\)[\s\S]*?game_id text not null references public\.games\(id\) on delete cascade[\s\S]*?player_id text not null references public\.players\(id\) on delete cascade[\s\S]*?user_id uuid references auth\.users\(id\) on delete set null[\s\S]*?game_intensity integer not null check \(game_intensity between 1 and 10\)[\s\S]*?remaining_energy integer not null check \(remaining_energy between 1 and 10\)[\s\S]*?calculation_version integer not null default 1[\s\S]*?created_at timestamptz not null default now\(\)[\s\S]*?\);/i);
  assertMatches(migrationSql, /create table if not exists public\.feature_rollouts\s*\([\s\S]*?key text primary key[\s\S]*?activated_at timestamptz not null default now\(\)[\s\S]*?transition_game_id text references public\.games\(id\) on delete set null[\s\S]*?\);/i);
});

test("feedback uniqueness and query indexes are present", () => {
  assertMatches(migrationSql, /create unique index if not exists game_feedback_one_per_player_game\s+on public\.game_feedback \(game_id, player_id\);/i);
  assertMatches(migrationSql, /create index if not exists game_feedback_game_id_idx\s+on public\.game_feedback \(game_id\);/i);
  assertMatches(migrationSql, /create index if not exists game_feedback_user_id_idx\s+on public\.game_feedback \(user_id\);/i);
  assertMatches(migrationSql, /create index if not exists game_feedback_player_created_idx\s+on public\.game_feedback \(player_id, created_at desc\);/i);
});

test("rollout is inserted once with a deterministic transition game", () => {
  assertMatches(migrationSql, /insert into public\.feature_rollouts \(key, activated_at, transition_game_id\)[\s\S]*?'postgame_feedback'[\s\S]*?where game\.status = 'finished'[\s\S]*?coalesce\(game\.score_saved_at, game\.updated_at\) desc nulls last[\s\S]*?game\.date desc[\s\S]*?game\.id desc[\s\S]*?on conflict \(key\) do nothing;/i);
});

test("table grants and RLS expose reads only to authenticated callers", () => {
  assertMatches(migrationSql, /revoke all on table public\.game_feedback from public, anon, authenticated;/i);
  assertMatches(migrationSql, /revoke all on table public\.feature_rollouts from public, anon, authenticated;/i);
  assertMatches(migrationSql, /grant select on table public\.game_feedback to authenticated;/i);
  assertMatches(migrationSql, /grant select on table public\.feature_rollouts to authenticated;/i);
  assert.doesNotMatch(normalized(migrationSql), /grant\s+(?:insert|update|delete)[^;]*public\.game_feedback/i);
  assert.doesNotMatch(normalized(migrationSql), /create\s+policy[\s\S]*?on\s+public\.game_feedback\s+for\s+(?:insert|update|delete|all)\b/i);
  assertMatches(migrationSql, /alter table public\.game_feedback enable row level security;/i);
  assertMatches(migrationSql, /alter table public\.feature_rollouts enable row level security;/i);
});

test("legacy direct MVP inserts are disabled without deleting existing votes", () => {
  assertMatches(migrationSql, /revoke insert on table public\.game_mvp_votes from authenticated;/i);
  assertMatches(migrationSql, /drop policy if exists "mvp votes insert linked player" on public\.game_mvp_votes;/i);
  assert.doesNotMatch(normalized(migrationSql), /delete\s+from\s+public\.game_mvp_votes/i);
  assert.doesNotMatch(normalized(migrationSql), /truncate\s+(?:table\s+)?public\.game_mvp_votes/i);
});

test("feedback policy permits only the owner or an admin, never a third party", () => {
  const policy = policyDefinition(migrationSql, "feedback read own or admin", "public.game_feedback");
  assertMatches(policy, /for select\s+to authenticated\s+using\s*\(\s*user_id = \(select auth\.uid\(\)\)\s+or \(select public\.is_admin\(\)\)\s*\)/i);
  assert.doesNotMatch(policy, /using\s*\(\s*true\s*\)/i);
});

test("rollout policy is authenticated read-only", () => {
  const policy = policyDefinition(migrationSql, "rollouts read authenticated", "public.feature_rollouts");
  assertMatches(policy, /for select\s+to authenticated\s+using\s*\(true\)/i);
});

test("private schema and both RPC layers have least-privilege execution", () => {
  const revokeSchema = normalized(migrationSql).indexOf(
    "revoke all on schema private from public, anon, authenticated;",
  );
  const grantUsage = normalized(migrationSql).indexOf(
    "grant usage on schema private to authenticated;",
  );
  assert.ok(revokeSchema >= 0 && grantUsage > revokeSchema);

  const internal = functionDefinition(
    migrationSql,
    "private.submit_postgame_checkin_internal",
  );
  const wrapper = functionDefinition(migrationSql, "public.submit_postgame_checkin");

  const legacyDrop = normalized(migrationSql).indexOf(
    "drop function if exists private.submit_postgame_checkin(text, text, integer, integer);",
  );
  const internalCreate = normalized(migrationSql).indexOf(
    "create or replace function private.submit_postgame_checkin_internal(",
  );
  assert.ok(legacyDrop >= 0 && internalCreate > legacyDrop);
  assert.doesNotMatch(migrationSql, /create\s+or\s+replace\s+function\s+private\.submit_postgame_checkin\s*\(/i);
  assertMatches(internal, /language plpgsql\s+security definer\s+set search_path = ''/i);
  assertMatches(wrapper, /language sql\s+security invoker\s+set search_path = ''/i);
  assertMatches(wrapper, /from private\.submit_postgame_checkin_internal\s*\(/i);
  assert.doesNotMatch(wrapper, /\binsert\s+into\b/i);

  assertMatches(migrationSql, /revoke all on function private\.submit_postgame_checkin_internal\(text, text, integer, integer\)\s+from public, anon, authenticated;/i);
  assertMatches(migrationSql, /grant execute on function private\.submit_postgame_checkin_internal\(text, text, integer, integer\)\s+to authenticated;/i);
  assertMatches(migrationSql, /revoke all on function public\.submit_postgame_checkin\(text, text, integer, integer\)\s+from public, anon, authenticated;/i);
  assertMatches(migrationSql, /grant execute on function public\.submit_postgame_checkin\(text, text, integer, integer\)\s+to authenticated;/i);
});

test("internal RPC validates auth, linked player, game state, and all participation lists", () => {
  const internal = functionDefinition(
    migrationSql,
    "private.submit_postgame_checkin_internal",
  );

  assertMatches(internal, /v_user_id := auth\.uid\(\);[\s\S]*?if v_user_id is null then[\s\S]*?'authentication_required'/i);
  assertMatches(internal, /where player\.linked_user_id = v_user_id;[\s\S]*?if v_linked_player_count <> 1 then/i);
  assertMatches(internal, /if v_game_status <> 'finished' then/i);

  for (const list of ["v_team_a", "v_team_b", "v_bench_a", "v_bench_b"]) {
    assertMatches(internal, new RegExp(`v_player_id = any\\(coalesce\\(${list}, '\\{\\}'::text\\[\\]\\)\\)`, "i"));
    assertMatches(internal, new RegExp(`p_candidate_player_id = any\\(coalesce\\(${list}, '\\{\\}'::text\\[\\]\\)\\)`, "i"));
  }

  assertMatches(internal, /p_candidate_player_id is null or p_candidate_player_id = v_player_id/i);
  assertMatches(internal, /'caller_did_not_participate'/i);
  assertMatches(internal, /'candidate_did_not_participate'/i);
});

test("internal RPC enforces ranges, rollout transition, and duplicate guards", () => {
  const internal = functionDefinition(
    migrationSql,
    "private.submit_postgame_checkin_internal",
  );

  assertMatches(internal, /p_game_intensity is null or p_game_intensity not between 1 and 10/i);
  assertMatches(internal, /p_remaining_energy is null or p_remaining_energy not between 1 and 10/i);
  assertMatches(internal, /coalesce\(game\.score_saved_at, game\.updated_at\)/i);
  assertMatches(internal, /p_game_id is distinct from v_transition_game_id[\s\S]*?v_finished_at < v_activated_at/i);
  assertMatches(internal, /from public\.game_mvp_votes as vote[\s\S]*?vote\.game_id = p_game_id[\s\S]*?vote\.voter_player_id = v_player_id/i);
  assertMatches(internal, /from public\.game_feedback as feedback[\s\S]*?feedback\.game_id = p_game_id[\s\S]*?feedback\.player_id = v_player_id/i);
});

test("one internal transaction performs both inserts and rethrows uniqueness errors", () => {
  const internal = functionDefinition(
    migrationSql,
    "private.submit_postgame_checkin_internal",
  );
  const voteInsert = internal.indexOf("insert into public.game_mvp_votes");
  const feedbackInsert = internal.indexOf("insert into public.game_feedback");

  assert.ok(voteInsert >= 0, "internal function must insert the MVP vote");
  assert.ok(feedbackInsert > voteInsert, "feedback insert must follow the MVP insert");
  assertMatches(internal, /exception\s+when unique_violation then\s+raise exception 'postgame_checkin_already_submitted'/i);
  assert.doesNotMatch(internal, /when\s+\w+\s+then\s+(?:null|return\s*;)/i);
});

test("RPC return contracts never expose the MVP candidate", () => {
  for (const name of [
    "private.submit_postgame_checkin_internal",
    "public.submit_postgame_checkin",
  ]) {
    const definition = functionDefinition(migrationSql, name);
    const returnColumns = definition.match(/returns table\s*\(([\s\S]*?)\)\s*language/i);
    assert.ok(returnColumns, `missing return table for ${name}`);
    assertMatches(returnColumns[1], /^\s*game_id text,\s*player_id text,\s*created_at timestamptz\s*$/i);
    assert.doesNotMatch(returnColumns[1], /candidate/i);
  }

  const internal = functionDefinition(
    migrationSql,
    "private.submit_postgame_checkin_internal",
  );
  assertMatches(internal, /return query\s+select v_feedback\.game_id, v_feedback\.player_id, v_feedback\.created_at;/i);
});
