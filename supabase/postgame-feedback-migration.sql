create table if not exists public.game_feedback (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  game_intensity integer not null check (game_intensity between 1 and 10),
  remaining_energy integer not null check (remaining_energy between 1 and 10),
  calculation_version integer not null default 1,
  created_at timestamptz not null default now()
);

comment on column public.game_feedback.user_id is
'Nullable so deleting an auth account anonymizes rather than destroys aggregate feedback.';

create unique index if not exists game_feedback_one_per_player_game
on public.game_feedback (game_id, player_id);

create index if not exists game_feedback_game_id_idx
on public.game_feedback (game_id);

create index if not exists game_feedback_user_id_idx
on public.game_feedback (user_id);

create index if not exists game_feedback_player_created_idx
on public.game_feedback (player_id, created_at desc);

create table if not exists public.feature_rollouts (
  key text primary key,
  activated_at timestamptz not null default now(),
  transition_game_id text references public.games(id) on delete set null
);

-- Capture the game that was current when the feature was deployed exactly once.
-- Its stable id makes that game eligible without pretending its older finish time
-- happened after activation; subsequent games use their persisted finish timestamp.
insert into public.feature_rollouts (key, activated_at, transition_game_id)
values (
  'postgame_feedback',
  now(),
  (
    select game.id
    from public.games as game
    where game.status = 'finished'
    order by
      coalesce(game.score_saved_at, game.updated_at) desc nulls last,
      game.date desc,
      game.id desc
    limit 1
  )
)
on conflict (key) do nothing;

revoke all on table public.game_feedback from public, anon, authenticated;
revoke all on table public.feature_rollouts from public, anon, authenticated;
grant select on table public.game_feedback to authenticated;
grant select on table public.feature_rollouts to authenticated;

-- Postgame votes and feedback must be committed together by the RPC below.
-- Existing vote rows are preserved; only the legacy direct insert path is closed.
revoke insert on table public.game_mvp_votes from authenticated;
drop policy if exists "mvp votes insert linked player" on public.game_mvp_votes;

alter table public.game_feedback enable row level security;
alter table public.feature_rollouts enable row level security;

drop policy if exists "feedback read own or admin" on public.game_feedback;
create policy "feedback read own or admin"
on public.game_feedback for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_admin())
);

drop policy if exists "rollouts read authenticated" on public.feature_rollouts;
create policy "rollouts read authenticated"
on public.feature_rollouts for select
to authenticated
using (true);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Remove the legacy privileged helper from the first rollout of this migration.
-- Drop the public wrapper first so upgrades are safe even if dependencies were tracked.
drop function if exists public.submit_postgame_checkin(text, text, integer, integer);
drop function if exists private.submit_postgame_checkin(text, text, integer, integer);

-- The privileged implementation lives outside the exposed public schema. It is
-- SECURITY DEFINER only so one transaction can write both RLS-protected tables.
-- Every relation is schema-qualified and the caller is re-derived from auth.uid().
create or replace function private.submit_postgame_checkin_internal(
  p_game_id text,
  p_candidate_player_id text,
  p_game_intensity integer,
  p_remaining_energy integer
)
returns table (
  game_id text,
  player_id text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_player_id text;
  v_linked_player_count bigint;
  v_game_status text;
  v_team_a text[];
  v_team_b text[];
  v_bench_a text[];
  v_bench_b text[];
  v_finished_at timestamptz;
  v_activated_at timestamptz;
  v_transition_game_id text;
  v_feedback public.game_feedback%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select count(*), min(player.id)
  into v_linked_player_count, v_player_id
  from public.players as player
  where player.linked_user_id = v_user_id;

  if v_linked_player_count <> 1 then
    raise exception 'exactly_one_linked_player_required' using errcode = 'P0001';
  end if;

  if p_game_intensity is null or p_game_intensity not between 1 and 10 then
    raise exception 'game_intensity_out_of_range' using errcode = '22023';
  end if;

  if p_remaining_energy is null or p_remaining_energy not between 1 and 10 then
    raise exception 'remaining_energy_out_of_range' using errcode = '22023';
  end if;

  select
    game.status,
    game.team_a,
    game.team_b,
    game.bench_a,
    game.bench_b,
    coalesce(game.score_saved_at, game.updated_at)
  into
    v_game_status,
    v_team_a,
    v_team_b,
    v_bench_a,
    v_bench_b,
    v_finished_at
  from public.games as game
  where game.id = p_game_id
  for share;

  if not found then
    raise exception 'game_not_found' using errcode = 'P0001';
  end if;

  if v_game_status <> 'finished' then
    raise exception 'game_not_finished' using errcode = 'P0001';
  end if;

  if not (
    v_player_id = any(coalesce(v_team_a, '{}'::text[]))
    or v_player_id = any(coalesce(v_team_b, '{}'::text[]))
    or v_player_id = any(coalesce(v_bench_a, '{}'::text[]))
    or v_player_id = any(coalesce(v_bench_b, '{}'::text[]))
  ) then
    raise exception 'caller_did_not_participate' using errcode = '42501';
  end if;

  if p_candidate_player_id is null or p_candidate_player_id = v_player_id then
    raise exception 'candidate_must_be_another_player' using errcode = '22023';
  end if;

  if not (
    p_candidate_player_id = any(coalesce(v_team_a, '{}'::text[]))
    or p_candidate_player_id = any(coalesce(v_team_b, '{}'::text[]))
    or p_candidate_player_id = any(coalesce(v_bench_a, '{}'::text[]))
    or p_candidate_player_id = any(coalesce(v_bench_b, '{}'::text[]))
  ) then
    raise exception 'candidate_did_not_participate' using errcode = '22023';
  end if;

  select rollout.activated_at, rollout.transition_game_id
  into v_activated_at, v_transition_game_id
  from public.feature_rollouts as rollout
  where rollout.key = 'postgame_feedback';

  if not found then
    raise exception 'postgame_feedback_not_activated' using errcode = 'P0001';
  end if;

  -- The transition id covers the game already completed at deployment. Every
  -- other game must have been finished at or after the rollout activation time.
  if p_game_id is distinct from v_transition_game_id
     and (v_finished_at is null or v_finished_at < v_activated_at) then
    raise exception 'game_predates_postgame_feedback' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.game_mvp_votes as vote
    where vote.game_id = p_game_id
      and vote.voter_player_id = v_player_id
  ) then
    raise exception 'mvp_vote_already_submitted' using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.game_feedback as feedback
    where feedback.game_id = p_game_id
      and feedback.player_id = v_player_id
  ) then
    raise exception 'postgame_feedback_already_submitted' using errcode = '23505';
  end if;

  insert into public.game_mvp_votes (
    game_id,
    voter_player_id,
    candidate_player_id,
    user_id
  )
  values (
    p_game_id,
    v_player_id,
    p_candidate_player_id,
    v_user_id
  );

  insert into public.game_feedback (
    game_id,
    player_id,
    user_id,
    game_intensity,
    remaining_energy
  )
  values (
    p_game_id,
    v_player_id,
    v_user_id,
    p_game_intensity,
    p_remaining_energy
  )
  returning * into v_feedback;

  return query
  select v_feedback.game_id, v_feedback.player_id, v_feedback.created_at;
exception
  when unique_violation then
    raise exception 'postgame_checkin_already_submitted' using errcode = '23505';
end;
$function$;

revoke all on function private.submit_postgame_checkin_internal(text, text, integer, integer)
from public, anon, authenticated;
grant execute on function private.submit_postgame_checkin_internal(text, text, integer, integer)
to authenticated;

-- PostgREST exposes only this invoker wrapper. Authenticated callers receive only
-- their own feedback identity and timestamp; the confidential MVP choice is absent.
create or replace function public.submit_postgame_checkin(
  p_game_id text,
  p_candidate_player_id text,
  p_game_intensity integer,
  p_remaining_energy integer
)
returns table (
  game_id text,
  player_id text,
  created_at timestamptz
)
language sql
security invoker
set search_path = ''
as $function$
  select result.game_id, result.player_id, result.created_at
  from private.submit_postgame_checkin_internal(
    p_game_id,
    p_candidate_player_id,
    p_game_intensity,
    p_remaining_energy
  ) as result;
$function$;

revoke all on function public.submit_postgame_checkin(text, text, integer, integer)
from public, anon, authenticated;
grant execute on function public.submit_postgame_checkin(text, text, integer, integer)
to authenticated;
