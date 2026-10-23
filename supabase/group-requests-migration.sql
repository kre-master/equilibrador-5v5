-- Fase 3.3 (2026-10-23): pedidos de grupos novos, aprovados pelo dono da app.
--
-- - private.platform_admins: contas que aprovam grupos (comeca com o dono dos Futeboleiros).
-- - Qualquer conta pede um grupo (nome, local, dia/hora, notas); um pedido pendente por conta.
-- - O dono da app aprova ou recusa; ao aprovar nasce o grupo e quem pediu fica owner.
-- Idempotente.

begin;

create table if not exists private.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on table private.platform_admins from public, anon, authenticated;

insert into private.platform_admins (user_id)
select user_id from public.group_members
where group_id = private.legacy_group_id() and role = 'owner'
on conflict (user_id) do nothing;

create or replace function private.is_platform_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from private.platform_admins where user_id = (select auth.uid())) $$;

revoke all on function private.is_platform_admin() from public, anon;
grant execute on function private.is_platform_admin() to authenticated;

-- A app pergunta se deve mostrar os pedidos de grupos.
create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select private.is_platform_admin() $$;

revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

create table if not exists public.group_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete cascade,
  requester_name text not null default '' check (char_length(requester_name) <= 60),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  location text not null default '' check (char_length(location) <= 80),
  schedule text not null default '' check (char_length(schedule) <= 80),
  notes text not null default '' check (char_length(notes) <= 300),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  group_id uuid references public.groups(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null
);

create unique index if not exists group_requests_one_pending_per_user
on public.group_requests (requested_by) where status = 'pending';

alter table public.group_requests enable row level security;
revoke all on table public.group_requests from public, anon, authenticated;
grant select on table public.group_requests to authenticated;

drop policy if exists "group requests read own or platform admin" on public.group_requests;
create policy "group requests read own or platform admin" on public.group_requests for select to authenticated
using (requested_by = (select auth.uid()) or private.is_platform_admin());

create or replace function public.request_group(p_name text, p_location text, p_schedule text, p_notes text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := left(btrim(coalesce(p_name, '')), 60);
  v_requester text;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if char_length(v_name) < 2 then
    raise exception 'name_required' using errcode = '22023';
  end if;
  if exists (select 1 from public.group_requests where requested_by = v_user_id and status = 'pending') then
    raise exception 'request_pending' using errcode = 'P0001';
  end if;
  select left(coalesce(nullif(btrim(display_name), ''), nullif(btrim(username), ''), 'Jogador'), 60)
  into v_requester from public.profiles where id = v_user_id;
  insert into public.group_requests (requested_by, requester_name, name, location, schedule, notes)
  values (v_user_id, coalesce(v_requester, 'Jogador'), v_name,
    left(btrim(coalesce(p_location, '')), 80), left(btrim(coalesce(p_schedule, '')), 80), left(btrim(coalesce(p_notes, '')), 300))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.cancel_group_request(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.group_requests set status = 'cancelled'
  where id = p_request_id and requested_by = (select auth.uid()) and status = 'pending';
  return 'cancelled';
end;
$$;

create or replace function public.decide_group_request(p_request_id uuid, p_approve boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.group_requests%rowtype;
  v_slug text;
  v_group_id uuid;
begin
  if not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode = '42501';
  end if;
  select * into v_request from public.group_requests where id = p_request_id for update;
  if not found then
    raise exception 'request_not_found' using errcode = 'P0001';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'request_already_decided' using errcode = 'P0001';
  end if;

  if not coalesce(p_approve, false) then
    update public.group_requests set status = 'rejected', decided_at = now(), decided_by = (select auth.uid())
    where id = p_request_id;
    return null;
  end if;

  -- Slug a partir do nome, com sufixo aleatorio para nunca colidir.
  v_slug := btrim(regexp_replace(lower(v_request.name), '[^a-z0-9]+', '-', 'g'), '-');
  v_slug := left(coalesce(nullif(v_slug, ''), 'grupo'), 30) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 5);
  insert into public.groups (slug, name, created_by)
  values (v_slug, v_request.name, v_request.requested_by)
  returning id into v_group_id;
  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, v_request.requested_by, 'owner');

  update public.group_requests
  set status = 'approved', group_id = v_group_id, decided_at = now(), decided_by = (select auth.uid())
  where id = p_request_id;
  return v_group_id;
end;
$$;

revoke all on function public.request_group(text, text, text, text) from public, anon;
revoke all on function public.cancel_group_request(uuid) from public, anon;
revoke all on function public.decide_group_request(uuid, boolean) from public, anon;
grant execute on function public.request_group(text, text, text, text) to authenticated;
grant execute on function public.cancel_group_request(uuid) to authenticated;
grant execute on function public.decide_group_request(uuid, boolean) to authenticated;

commit;
