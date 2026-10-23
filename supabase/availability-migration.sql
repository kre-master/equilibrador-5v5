-- Fase 3 (2026-10-23): disponibilidade semanal e convites do admin a jogadores disponiveis.
--
-- - player_availability: a conta diz em que dias e horas (hora de Portugal) pode jogar. So a propria
--   conta le e escreve; os admins veem-na pelo RPC list_available_players, para o seu jogo.
-- - event_join_requests ganha 'invited' (o admin convidou) e 'declined' (o jogador recusou).
-- - invite_to_event: o admin convida uma conta de fora do grupo para a convocatoria.
-- - respond_event_invite: o jogador aceita (fica convidado com "Vou") ou recusa.
-- - list_public_events passa a mostrar tambem os jogos para onde a conta foi convidada.
-- Idempotente.

begin;

create table if not exists public.player_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  from_hour smallint not null check (from_hour between 0 and 23),
  to_hour smallint not null check (to_hour between 1 and 24),
  created_at timestamptz not null default now(),
  check (to_hour > from_hour),
  unique (user_id, day)
);

create index if not exists player_availability_day_idx on public.player_availability (day);

alter table public.player_availability enable row level security;
revoke all on table public.player_availability from public, anon, authenticated;
grant select, insert, update, delete on table public.player_availability to authenticated;

drop policy if exists "availability own" on public.player_availability;
create policy "availability own" on public.player_availability for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

alter table public.event_join_requests drop constraint if exists event_join_requests_status_check;
alter table public.event_join_requests add constraint event_join_requests_status_check
  check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'invited', 'declined'));

-- Aceitar um pedido ou convite: ficha de convidado no grupo (reutiliza se existir) e "Vou".
create or replace function private.accept_join_request(p_request_id uuid, p_decided_by uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.event_join_requests%rowtype;
  v_group_id uuid;
  v_player_id text;
  v_rating integer;
begin
  select * into v_request from public.event_join_requests where id = p_request_id for update;
  v_group_id := private.event_group(v_request.event_id);

  select id into v_player_id from public.players
  where group_id = v_group_id and linked_user_id = v_request.user_id
  limit 1;

  if v_player_id is null then
    select coalesce(round(avg(overall))::integer, 60) into v_rating
    from public.players where group_id = v_group_id and not is_guest;
    v_player_id := 'p-' || gen_random_uuid()::text;
    insert into public.players (id, name, pace, shooting, passing, dribbling, defending, physical, overall,
      linked_user_id, is_guest, group_id)
    values (v_player_id, v_request.requester_name, v_rating, v_rating, v_rating, v_rating, v_rating, v_rating, v_rating,
      v_request.user_id, true, v_group_id);
  end if;

  begin
    insert into public.event_responses (event_id, player_id, user_id, status)
    values (v_request.event_id, v_player_id, v_request.user_id, 'going')
    on conflict (event_id, player_id) do update set status = 'going', updated_at = now();
  exception
    when sqlstate 'P0001' then
      raise exception 'event_full' using errcode = 'P0001';
  end;

  update public.event_join_requests
  set status = 'accepted', player_id = v_player_id, decided_at = now(), decided_by = p_decided_by
  where id = p_request_id;
  return 'accepted';
end;
$$;

revoke all on function private.accept_join_request(uuid, uuid) from public, anon, authenticated;

create or replace function public.decide_public_event_request(p_request_id uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.event_join_requests%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  select * into v_request from public.event_join_requests where id = p_request_id for update;
  if not found then
    raise exception 'request_not_found' using errcode = 'P0001';
  end if;
  if not private.is_group_admin(private.event_group(v_request.event_id)) then
    raise exception 'group_admin_required' using errcode = '42501';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'request_already_decided' using errcode = 'P0001';
  end if;
  if not coalesce(p_accept, false) then
    update public.event_join_requests
    set status = 'rejected', decided_at = now(), decided_by = (select auth.uid())
    where id = p_request_id;
    return 'rejected';
  end if;
  return private.accept_join_request(p_request_id, (select auth.uid()));
end;
$$;

-- Admin: quem esta disponivel na semana do jogo, de fora do grupo. Compativeis (mesmo dia e hora) primeiro.
create or replace function public.list_available_players(p_event_id text)
returns table (
  user_id uuid,
  name text,
  fitness text,
  player_position text,
  age_band text,
  day date,
  from_hour smallint,
  to_hour smallint,
  compatible boolean,
  request_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_local timestamp;
  v_week_start date;
begin
  select * into v_event from public.events where id = p_event_id;
  if not found or not private.is_group_admin(v_event.group_id) then
    raise exception 'group_admin_required' using errcode = '42501';
  end if;
  v_local := v_event.starts_at at time zone 'Europe/Lisbon';
  v_week_start := date_trunc('week', v_local)::date;

  return query
  select
    slot.user_id,
    left(coalesce(nullif(btrim(profile.display_name), ''), nullif(btrim(profile.username), ''), 'Jogador'), 60),
    traits.fitness,
    traits.position,
    traits.age_band,
    slot.day,
    slot.from_hour,
    slot.to_hour,
    slot.day = v_local::date
      and slot.from_hour <= extract(hour from v_local)
      and slot.to_hour > extract(hour from v_local),
    request.status
  from public.player_availability as slot
  left join public.profiles as profile on profile.id = slot.user_id
  left join public.player_traits as traits on traits.user_id = slot.user_id
  left join public.event_join_requests as request on request.event_id = p_event_id and request.user_id = slot.user_id
  where slot.day between v_week_start and v_week_start + 6
    and not exists (
      select 1 from public.group_members as member
      where member.group_id = v_event.group_id and member.user_id = slot.user_id
    )
  order by 9 desc, abs(slot.day - v_local::date), 2;
end;
$$;

create or replace function public.invite_to_event(p_event_id text, p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_existing text;
  v_name text;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  select * into v_event from public.events where id = p_event_id;
  if not found or not private.is_group_admin(v_event.group_id) then
    raise exception 'group_admin_required' using errcode = '42501';
  end if;
  if v_event.status <> 'open' or v_event.starts_at < now() then
    raise exception 'event_not_open' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.group_members where group_id = v_event.group_id and user_id = p_user_id) then
    raise exception 'already_group_member' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.player_availability where user_id = p_user_id) then
    raise exception 'player_not_available' using errcode = 'P0001';
  end if;

  select status into v_existing from public.event_join_requests where event_id = p_event_id and user_id = p_user_id;
  if v_existing in ('pending', 'accepted', 'invited') then
    return v_existing;
  end if;

  select left(coalesce(nullif(btrim(display_name), ''), nullif(btrim(username), ''), 'Jogador'), 60)
  into v_name from public.profiles where id = p_user_id;

  insert into public.event_join_requests (event_id, user_id, requester_name, status, decided_by)
  values (p_event_id, p_user_id, coalesce(v_name, 'Jogador'), 'invited', (select auth.uid()))
  on conflict (event_id, user_id) do update
    set status = 'invited', requester_name = excluded.requester_name, created_at = now(),
        decided_at = null, decided_by = excluded.decided_by;
  return 'invited';
end;
$$;

create or replace function public.respond_event_invite(p_event_id text, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.event_join_requests%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  select * into v_request from public.event_join_requests
  where event_id = p_event_id and user_id = (select auth.uid()) and status = 'invited'
  for update;
  if not found then
    raise exception 'invite_not_found' using errcode = 'P0001';
  end if;
  if not coalesce(p_accept, false) then
    update public.event_join_requests set status = 'declined', decided_at = now() where id = v_request.id;
    return 'declined';
  end if;
  return private.accept_join_request(v_request.id, (select auth.uid()));
end;
$$;

-- Jogos publicos + jogos onde a conta tem pedido ou convite em aberto.
create or replace function public.list_public_events()
returns table (
  event_id text,
  title text,
  starts_at timestamptz,
  location text,
  group_name text,
  needs text,
  spots_left integer,
  my_status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    event.id,
    event.title,
    event.starts_at,
    event.location,
    grp.name,
    event.public_needs,
    greatest(event.max_players - (
      select count(*)::integer from public.event_responses as response
      where response.event_id = event.id and response.status = 'going'
    ), 0),
    request.status
  from public.events as event
  join public.groups as grp on grp.id = event.group_id
  left join public.event_join_requests as request
    on request.event_id = event.id and request.user_id = (select auth.uid())
  where (select auth.uid()) is not null
    and not private.is_group_member(event.group_id)
    and (
      (event.visibility = 'public' and event.status = 'open' and event.starts_at > now() - interval '3 hours')
      or request.status in ('pending', 'accepted')
      or (request.status = 'invited' and event.status = 'open' and event.starts_at > now() - interval '3 hours')
    )
  order by event.starts_at;
$$;

revoke all on function public.list_available_players(text) from public, anon;
revoke all on function public.invite_to_event(text, uuid) from public, anon;
revoke all on function public.respond_event_invite(text, boolean) from public, anon;
grant execute on function public.list_available_players(text) to authenticated;
grant execute on function public.invite_to_event(text, uuid) to authenticated;
grant execute on function public.respond_event_invite(text, boolean) to authenticated;

commit;
