-- Fase 3.1.3 (2026-10-23): jogos publicos e pedidos de entrada.
--
-- - Um evento pode ser 'public' (mesmo num grupo privado) e dizer o que precisa: campo, misto ou redes.
-- - Quem nao e do grupo ve esses jogos so pelo RPC list_public_events: data, hora, local, grupo,
--   vagas e o que o jogo precisa. Nunca a lista de jogadores.
-- - Cada conta tem caracteristicas opcionais (forma, posicao, faixa etaria), vistas so pelo admin
--   de um jogo a que pediu para ir.
-- - Pedir, cancelar e decidir passam por RPC. Ao aceitar, a pessoa ganha (ou reutiliza) uma ficha de
--   convidado nesse grupo e fica com "Vou" na convocatoria.
-- Idempotente.

begin;

-- ---------------------------------------------------------------------------
-- Eventos publicos
-- ---------------------------------------------------------------------------

alter table public.events add column if not exists visibility text not null default 'group';
alter table public.events add column if not exists public_needs text;

alter table public.events drop constraint if exists events_visibility_check;
alter table public.events add constraint events_visibility_check check (visibility in ('group', 'public'));
alter table public.events drop constraint if exists events_public_needs_check;
alter table public.events add constraint events_public_needs_check
  check (public_needs is null or public_needs in ('outfield', 'mixed', 'goalkeeper'));

-- ---------------------------------------------------------------------------
-- Caracteristicas do jogador (da conta, opcionais)
-- ---------------------------------------------------------------------------

create table if not exists public.player_traits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fitness text check (fitness in ('relaxed', 'regular', 'athletic')),
  position text check (position in ('goalkeeper', 'mixed', 'outfield')),
  age_band text check (age_band in ('18-24', '25-34', '35-44', '45+')),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pedidos de entrada
-- ---------------------------------------------------------------------------

create table if not exists public.event_join_requests (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  requester_name text not null default '' check (char_length(requester_name) <= 60),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  player_id text references public.players(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null,
  unique (event_id, user_id)
);

create index if not exists event_join_requests_user_idx on public.event_join_requests (user_id);

alter table public.player_traits enable row level security;
alter table public.event_join_requests enable row level security;
revoke all on table public.player_traits from public, anon, authenticated;
revoke all on table public.event_join_requests from public, anon, authenticated;
grant select, insert, update on table public.player_traits to authenticated;
grant select on table public.event_join_requests to authenticated;

drop policy if exists "join requests read own or admin" on public.event_join_requests;
create policy "join requests read own or admin" on public.event_join_requests for select to authenticated
using (user_id = (select auth.uid()) or private.is_group_admin(private.event_group(event_id)));

drop policy if exists "traits read own or requested admin" on public.player_traits;
create policy "traits read own or requested admin" on public.player_traits for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.event_join_requests as request
    where request.user_id = player_traits.user_id
      and request.status in ('pending', 'accepted')
      and private.is_group_admin(private.event_group(request.event_id))
  )
);

drop policy if exists "traits insert own" on public.player_traits;
create policy "traits insert own" on public.player_traits for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "traits update own" on public.player_traits;
create policy "traits update own" on public.player_traits for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Jogos publicos de grupos onde a conta nao esta, mais os que ja pediu.
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
    )
  order by event.starts_at;
$$;

create or replace function public.request_public_event(p_event_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_event public.events%rowtype;
  v_existing text;
  v_name text;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  select * into v_event from public.events where id = p_event_id;
  if not found or v_event.visibility <> 'public' or v_event.status <> 'open' or v_event.starts_at < now() then
    raise exception 'event_not_public' using errcode = 'P0001';
  end if;
  if private.is_group_member(v_event.group_id) then
    raise exception 'already_group_member' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.player_traits
    where user_id = v_user_id and fitness is not null and position is not null and age_band is not null
  ) then
    raise exception 'traits_required' using errcode = 'P0001';
  end if;

  select status into v_existing from public.event_join_requests where event_id = p_event_id and user_id = v_user_id;
  if v_existing in ('pending', 'accepted') then
    return v_existing;
  end if;
  if v_existing = 'rejected' then
    raise exception 'request_rejected' using errcode = 'P0001';
  end if;

  select left(coalesce(nullif(btrim(display_name), ''), nullif(btrim(username), ''), 'Jogador'), 60)
  into v_name from public.profiles where id = v_user_id;

  insert into public.event_join_requests (event_id, user_id, requester_name, status)
  values (p_event_id, v_user_id, coalesce(v_name, 'Jogador'), 'pending')
  on conflict (event_id, user_id) do update
    set status = 'pending', requester_name = excluded.requester_name, created_at = now(),
        decided_at = null, decided_by = null;
  return 'pending';
end;
$$;

create or replace function public.cancel_public_event_request(p_event_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  -- So pedidos por decidir; depois de aceite, sai pela convocatoria com o admin.
  update public.event_join_requests
  set status = 'cancelled'
  where event_id = p_event_id and user_id = (select auth.uid()) and status = 'pending';
  return 'cancelled';
end;
$$;

create or replace function public.decide_public_event_request(p_request_id uuid, p_accept boolean)
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
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  select * into v_request from public.event_join_requests where id = p_request_id for update;
  if not found then
    raise exception 'request_not_found' using errcode = 'P0001';
  end if;
  v_group_id := private.event_group(v_request.event_id);
  if not private.is_group_admin(v_group_id) then
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

  -- Ficha de convidado da pessoa neste grupo: reutiliza se ja existir.
  select id into v_player_id from public.players
  where group_id = v_group_id and linked_user_id = v_request.user_id
  limit 1;

  if v_player_id is null then
    -- Nota neutra: a media do grupo, para nao desequilibrar as equipas antes de o admin a ajustar.
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
  set status = 'accepted', player_id = v_player_id, decided_at = now(), decided_by = (select auth.uid())
  where id = p_request_id;
  return 'accepted';
end;
$$;

revoke all on function public.list_public_events() from public, anon;
revoke all on function public.request_public_event(text) from public, anon;
revoke all on function public.cancel_public_event_request(text) from public, anon;
revoke all on function public.decide_public_event_request(uuid, boolean) from public, anon;
grant execute on function public.list_public_events() to authenticated;
grant execute on function public.request_public_event(text) to authenticated;
grant execute on function public.cancel_public_event_request(text) to authenticated;
grant execute on function public.decide_public_event_request(uuid, boolean) to authenticated;

commit;
