-- Fase 3.1 (2026-10-23): coerencia entre grupos e papeis por grupo.
--
-- 1. Fecho pos-jogo: a conta pode ter uma ficha em cada grupo; usa-se a ficha do grupo do jogo.
-- 2. Nenhum jogo, resposta, pagamento, presenca ou forma pode usar uma ficha de outro grupo.
--    (Ids que ja nao existem continuam aceites, para nao bloquear jogos antigos.)
-- 3. Papeis mudam-se por grupo com public.set_group_member_role; o dono nao e despromovido e
--    ninguem muda o proprio papel. Nos Futeboleiros, profiles.role continua sincronizado.
--
-- O default de group_id (Futeboleiros) fica ate a 3.2, para versoes antigas da app em cache
-- continuarem a gravar. Idempotente.

begin;

-- ---------------------------------------------------------------------------
-- 1. Fecho pos-jogo com a ficha do grupo do jogo
-- ---------------------------------------------------------------------------

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
  v_has_existing_vote boolean;
  v_feedback public.game_feedback%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  -- Uma ficha por grupo: conta so a ficha da conta no grupo deste jogo.
  select count(*), min(player.id)
  into v_linked_player_count, v_player_id
  from public.players as player
  where player.linked_user_id = v_user_id
    and player.group_id = (select game.group_id from public.games as game where game.id = p_game_id);

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

  select exists (
    select 1
    from public.game_mvp_votes as vote
    where vote.game_id = p_game_id
      and vote.voter_player_id = v_player_id
  ) into v_has_existing_vote;

  if v_has_existing_vote and p_candidate_player_id is not null then
    raise exception 'existing_mvp_vote_must_be_preserved' using errcode = '22023';
  end if;

  if not v_has_existing_vote then
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
  end if;

  if exists (
    select 1
    from public.game_feedback as feedback
    where feedback.game_id = p_game_id
      and feedback.player_id = v_player_id
  ) then
    raise exception 'postgame_feedback_already_submitted' using errcode = '23505';
  end if;

  if not v_has_existing_vote then
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
  end if;

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

-- ---------------------------------------------------------------------------
-- 2. Fichas so do proprio grupo
-- ---------------------------------------------------------------------------

create or replace function private.assert_players_in_group(p_player_ids text[], p_group_id uuid)
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if p_group_id is null then
    return;
  end if;
  if exists (
    select 1 from public.players
    where id = any(coalesce(p_player_ids, '{}'::text[])) and group_id <> p_group_id
  ) then
    raise exception 'player_from_another_group' using errcode = '23514';
  end if;
end;
$$;

create or replace function private.enforce_same_group_players()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  case tg_table_name
    when 'games' then
      perform private.assert_players_in_group(
        coalesce(new.team_a, '{}') || coalesce(new.team_b, '{}') || coalesce(new.bench_a, '{}') || coalesce(new.bench_b, '{}'),
        new.group_id);
    when 'event_responses' then
      perform private.assert_players_in_group(array[new.player_id], private.event_group(new.event_id));
    when 'payments' then
      perform private.assert_players_in_group(array[new.player_id], new.group_id);
    when 'attendance_overrides' then
      perform private.assert_players_in_group(array[new.player_id], private.game_group(new.game_id));
    when 'player_form_snapshots' then
      if new.game_id is not null then
        perform private.assert_players_in_group(array[new.player_id], private.game_group(new.game_id));
      end if;
    else
      null;
  end case;
  return new;
end;
$$;

revoke all on function private.assert_players_in_group(text[], uuid) from public, anon, authenticated;
revoke all on function private.enforce_same_group_players() from public, anon, authenticated;

drop trigger if exists games_same_group_players on public.games;
create trigger games_same_group_players
before insert or update of team_a, team_b, bench_a, bench_b, group_id on public.games
for each row execute function private.enforce_same_group_players();

drop trigger if exists event_responses_same_group_players on public.event_responses;
create trigger event_responses_same_group_players
before insert or update of player_id, event_id on public.event_responses
for each row execute function private.enforce_same_group_players();

drop trigger if exists payments_same_group_players on public.payments;
create trigger payments_same_group_players
before insert or update of player_id, group_id on public.payments
for each row execute function private.enforce_same_group_players();

drop trigger if exists attendance_overrides_same_group_players on public.attendance_overrides;
create trigger attendance_overrides_same_group_players
before insert or update of player_id, game_id on public.attendance_overrides
for each row execute function private.enforce_same_group_players();

drop trigger if exists player_form_snapshots_same_group_players on public.player_form_snapshots;
create trigger player_form_snapshots_same_group_players
before insert or update of player_id, game_id on public.player_form_snapshots
for each row execute function private.enforce_same_group_players();

-- ---------------------------------------------------------------------------
-- 3. Papeis por grupo
-- ---------------------------------------------------------------------------

create or replace function public.set_group_member_role(p_group_id uuid, p_user_id uuid, p_role text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current text;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if not private.is_group_admin(p_group_id) then
    raise exception 'group_admin_required' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('admin', 'player') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'cannot_change_own_role' using errcode = 'P0001';
  end if;

  select role into v_current
  from public.group_members
  where group_id = p_group_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'not_a_group_member' using errcode = 'P0001';
  end if;
  if v_current = 'owner' then
    raise exception 'owner_role_is_fixed' using errcode = 'P0001';
  end if;

  update public.group_members set role = p_role where group_id = p_group_id and user_id = p_user_id;

  -- Compatibilidade: nos Futeboleiros a app antiga ainda le profiles.role.
  if p_group_id = private.legacy_group_id() then
    update public.profiles set role = p_role, updated_at = now() where id = p_user_id;
  end if;

  return p_role;
end;
$$;

revoke all on function public.set_group_member_role(uuid, uuid, text) from public, anon;
grant execute on function public.set_group_member_role(uuid, uuid, text) to authenticated;

commit;
