-- Perfil do grupo/clube: bio, simbolo, perfil publico, local habitual, clube favorito, sair do grupo,
-- pesquisa de clubes e pedidos de entrada.
-- Idempotente. Correr no SQL Editor do Supabase depois de groups-migration.sql, groups-integrity-migration.sql
-- e public-games-migration.sql.
--
-- logo: nulo, 'preset:<chave>' (emblema da lista da app) ou uma imagem pequena em data URL
-- (a app redimensiona para 128x128 antes de enviar). Escrita so por admins do grupo, via RPC.
--
-- Perfil publico por defeito: quem pesquisa ve so nome, simbolo, bio e numero de membros
-- (nunca jogadores, jogos ou financas). Os admins podem desligar em "Editar".
-- ATENCAO: isto torna publicos, por defeito, tambem os grupos que ja existem.

begin;

alter table public.groups
  add column if not exists bio text not null default '' check (char_length(bio) <= 300),
  add column if not exists logo text check (
    logo is null
    or (logo ~ '^preset:[a-z0-9-]{1,30}$')
    or (logo ~ '^data:image/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+$' and char_length(logo) <= 60000)
  ),
  add column if not exists profile_public boolean not null default true,
  add column if not exists default_location text not null default '' check (char_length(default_location) <= 80);

alter table public.group_members
  add column if not exists is_favorite boolean not null default false;

create unique index if not exists group_members_one_favorite
on public.group_members (user_id) where is_favorite;

-- ---------------------------------------------------------------------------
-- Perfil do grupo (so admins), favorito e sair
-- ---------------------------------------------------------------------------

drop function if exists public.update_group_profile(uuid, text, text);

create or replace function public.update_group_profile(
  p_group_id uuid, p_bio text, p_logo text, p_public boolean, p_default_location text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if not private.is_group_admin(p_group_id) then
    raise exception 'group_admin_required' using errcode = '42501';
  end if;
  update public.groups
  set bio = left(btrim(coalesce(p_bio, '')), 300),
      logo = nullif(btrim(coalesce(p_logo, '')), ''),
      profile_public = coalesce(p_public, profile_public),
      default_location = left(btrim(coalesce(p_default_location, '')), 80)
  where id = p_group_id;
  return 'updated';
end;
$$;

create or replace function public.set_favorite_group(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.group_members where group_id = p_group_id and user_id = v_user_id) then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  update public.group_members set is_favorite = false where user_id = v_user_id and is_favorite;
  update public.group_members set is_favorite = true where group_id = p_group_id and user_id = v_user_id;
  return 'favorite';
end;
$$;

-- Sair de um grupo: o dono nao sai; o perfil de jogador ligado a esta conta fica solto (os jogos mantem-se).
create or replace function public.leave_group(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_role text;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  select role into v_role from public.group_members
  where group_id = p_group_id and user_id = v_user_id for update;
  if not found then
    raise exception 'not_a_member' using errcode = 'P0001';
  end if;
  if v_role = 'owner' then
    raise exception 'owner_cannot_leave' using errcode = 'P0001';
  end if;
  update public.players set linked_user_id = null, updated_at = now()
  where group_id = p_group_id and linked_user_id = v_user_id;
  delete from public.group_members where group_id = p_group_id and user_id = v_user_id;
  return 'left';
end;
$$;

-- ---------------------------------------------------------------------------
-- Pesquisa de clubes e pedidos de entrada
-- ---------------------------------------------------------------------------

create table if not exists public.group_join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  requester_name text not null default '' check (char_length(requester_name) <= 60),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null
);

create unique index if not exists group_join_requests_one_pending
on public.group_join_requests (group_id, user_id) where status = 'pending';

alter table public.group_join_requests enable row level security;
revoke all on table public.group_join_requests from public, anon, authenticated;
grant select on table public.group_join_requests to authenticated;

drop policy if exists "group join requests read own or admin" on public.group_join_requests;
create policy "group join requests read own or admin" on public.group_join_requests for select to authenticated
using (user_id = (select auth.uid()) or private.is_group_admin(group_id));

create or replace function public.search_clubs(p_query text)
returns table (id uuid, name text, bio text, logo text, member_count integer, is_member boolean, request_status text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    grp.id,
    grp.name,
    grp.bio,
    grp.logo,
    (select count(*)::integer from public.group_members as member where member.group_id = grp.id),
    private.is_group_member(grp.id),
    (select request.status from public.group_join_requests as request
      where request.group_id = grp.id and request.user_id = (select auth.uid()) and request.status = 'pending'
      limit 1)
  from public.groups as grp
  where (select auth.uid()) is not null
    and grp.profile_public
    and (coalesce(btrim(p_query), '') = '' or grp.name ilike '%' || replace(replace(btrim(p_query), '%', ''), '_', '') || '%')
  order by grp.name
  limit 30;
$$;

create or replace function public.request_join_group(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.groups where id = p_group_id and profile_public) then
    raise exception 'club_not_found' using errcode = 'P0001';
  end if;
  if private.is_group_member(p_group_id) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;
  select left(coalesce(nullif(btrim(display_name), ''), nullif(btrim(username), ''), 'Jogador'), 60)
  into v_name from public.profiles where id = v_user_id;
  insert into public.group_join_requests (group_id, user_id, requester_name)
  values (p_group_id, v_user_id, coalesce(v_name, 'Jogador'))
  on conflict (group_id, user_id) where status = 'pending' do nothing;
  return 'pending';
end;
$$;

create or replace function public.cancel_join_group_request(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.group_join_requests set status = 'cancelled', decided_at = now()
  where id = p_request_id and user_id = (select auth.uid()) and status = 'pending';
  return 'cancelled';
end;
$$;

create or replace function public.decide_join_group_request(p_request_id uuid, p_approve boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.group_join_requests%rowtype;
begin
  select * into v_request from public.group_join_requests where id = p_request_id for update;
  if not found or v_request.status <> 'pending' then
    raise exception 'request_not_pending' using errcode = 'P0001';
  end if;
  if not private.is_group_admin(v_request.group_id) then
    raise exception 'group_admin_required' using errcode = '42501';
  end if;
  update public.group_join_requests
  set status = case when coalesce(p_approve, false) then 'accepted' else 'rejected' end,
      decided_at = now(), decided_by = (select auth.uid())
  where id = p_request_id;
  if coalesce(p_approve, false) then
    insert into public.group_members (group_id, user_id, role)
    values (v_request.group_id, v_request.user_id, 'player')
    on conflict (group_id, user_id) do nothing;
  end if;
  return case when coalesce(p_approve, false) then 'accepted' else 'rejected' end;
end;
$$;

revoke all on function public.update_group_profile(uuid, text, text, boolean, text) from public, anon;
revoke all on function public.set_favorite_group(uuid) from public, anon;
revoke all on function public.leave_group(uuid) from public, anon;
revoke all on function public.search_clubs(text) from public, anon;
revoke all on function public.request_join_group(uuid) from public, anon;
revoke all on function public.cancel_join_group_request(uuid) from public, anon;
revoke all on function public.decide_join_group_request(uuid, boolean) from public, anon;
grant execute on function public.update_group_profile(uuid, text, text, boolean, text) to authenticated;
grant execute on function public.set_favorite_group(uuid) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.search_clubs(text) to authenticated;
grant execute on function public.request_join_group(uuid) to authenticated;
grant execute on function public.cancel_join_group_request(uuid) to authenticated;
grant execute on function public.decide_join_group_request(uuid, boolean) to authenticated;

commit;
