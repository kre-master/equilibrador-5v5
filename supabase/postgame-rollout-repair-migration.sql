-- Repairs the initial postgame rollout when legacy games without score_saved_at
-- were selected through a later bulk updated_at timestamp.
do $repair$
declare
  v_previous_transition_game_id text;
  v_latest_finished_game_id text;
begin
  select rollout.transition_game_id
  into v_previous_transition_game_id
  from public.feature_rollouts as rollout
  where rollout.key = 'postgame_feedback'
  for update;

  if not found then
    raise exception 'postgame_feedback_rollout_not_found';
  end if;

  select game.id
  into v_latest_finished_game_id
  from public.games as game
  where game.status = 'finished'
  order by
    game.date desc,
    coalesce(game.score_saved_at, game.updated_at) desc nulls last,
    game.id desc
  limit 1;

  if v_latest_finished_game_id is null then
    raise exception 'finished_game_not_found';
  end if;

  if v_previous_transition_game_id is distinct from v_latest_finished_game_id then
    delete from public.game_feedback as feedback
    where feedback.game_id = v_previous_transition_game_id;

    update public.feature_rollouts as rollout
    set transition_game_id = v_latest_finished_game_id
    where rollout.key = 'postgame_feedback';
  end if;
end;
$repair$;
