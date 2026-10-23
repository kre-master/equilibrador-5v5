-- Ensaio da migracao 3.0 sem deixar alteracoes.
-- Correr no SQL editor do Supabase (ou pela API) como UM unico pedido: o Postgres trata varias
-- instrucoes enviadas juntas como uma transacao, e o erro final desfaz tudo.
-- O resultado aparece na mensagem de erro "DRYRUN_RESULT ...". Nada fica gravado.
--
-- Antes de correr: colar aqui o conteudo de groups-migration.sql SEM as linhas "begin;" e "commit;".
-- (scripts/ nao tem gerador; o passo e manual de proposito.)

-- >>> colar migracao aqui <<<

do $dryrun$
declare
  v_out text := '';
  v_case record;
  v_players int; v_games int; v_events int; v_responses int; v_payments int; v_finance int;
  v_votes int; v_vote_count_rows int; v_profiles int; v_groups int; v_admin boolean;
  v_target uuid;
begin
  v_out := v_out || format('base: players=%s games=%s events=%s responses=%s payments=%s votes=%s members=%s owner=%s | ',
    (select count(*) from public.players), (select count(*) from public.games), (select count(*) from public.events),
    (select count(*) from public.event_responses), (select count(*) from public.payments),
    (select count(*) from public.game_mvp_votes), (select count(*) from public.group_members),
    (select count(*) from public.group_members where role = 'owner'));

  for v_case in
    select 'owner' as label, (select user_id from public.group_members where role = 'owner' limit 1) as uid
    union all
    select 'admin', (select user_id from public.group_members where role = 'admin' limit 1)
    union all
    select 'player', (
      select member.user_id from public.group_members as member
      join public.players as player on player.linked_user_id = member.user_id
      where member.role = 'player' limit 1)
    union all
    select 'outsider', gen_random_uuid()
  loop
    perform set_config('request.jwt.claims', json_build_object('sub', v_case.uid, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';

    select count(*) into v_players from public.players;
    select count(*) into v_games from public.games;
    select count(*) into v_events from public.events;
    select count(*) into v_responses from public.event_responses;
    select count(*) into v_payments from public.payments;
    select count(*) into v_finance from public.finance_settings;
    select count(*) into v_votes from public.game_mvp_votes;
    select count(*) into v_vote_count_rows from public.mvp_vote_counts();
    select count(*) into v_profiles from public.profiles;
    select count(*) into v_groups from public.groups;
    select public.is_admin() into v_admin;

    v_out := v_out || format('%s: admin=%s players=%s games=%s events=%s responses=%s payments=%s finance=%s ownvotes=%s votecountrows=%s profiles=%s groups=%s',
      v_case.label, v_admin, v_players, v_games, v_events, v_responses, v_payments, v_finance, v_votes, v_vote_count_rows, v_profiles, v_groups);

    -- Um jogador nao consegue promover-se a admin.
    if v_case.label = 'player' then
      begin
        update public.profiles set role = 'admin' where id = v_case.uid;
        v_out := v_out || ' selfpromote=ALLOWED(!)';
      exception when others then
        v_out := v_out || ' selfpromote=blocked(' || sqlerrm || ')';
      end;
      begin
        update public.game_mvp_votes set candidate_player_id = candidate_player_id;
        v_out := v_out || ' voteupdate=ALLOWED(!)';
      exception when others then
        v_out := v_out || ' voteupdate=blocked(' || sqlerrm || ')';
      end;
    end if;

    -- O dono continua a conseguir mudar o role de outra conta (botao "Tornar admin" da app).
    if v_case.label = 'owner' then
      select member.user_id into v_target from public.group_members as member where member.role = 'player' limit 1;
      begin
        update public.profiles set role = 'admin' where id = v_target;
        v_out := v_out || format(' promote_other=ok(rows=%s)', (select count(*) from public.profiles where id = v_target and role = 'admin'));
      exception when others then
        v_out := v_out || ' promote_other=FAILED(' || sqlerrm || ')';
      end;
    end if;

    execute 'reset role';
    v_out := v_out || ' | ';
  end loop;

  raise exception 'DRYRUN_RESULT %', v_out;
end
$dryrun$;
