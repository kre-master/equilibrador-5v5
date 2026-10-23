-- Fase 3.2 (2026-10-23): convites para grupos.
--
-- - Cada grupo tem um link de convite ativo (codigo aleatorio). O admin ve-o, partilha-o e pode
--   gerar outro, o que anula o anterior.
-- - Quem abre o link ve o nome do grupo (mesmo antes de entrar) e, com conta, entra como jogador.
-- - Contas novas deixam de entrar automaticamente nos Futeboleiros: sem convite ficam sem grupo.
--   profiles.role continua sincronizado com os Futeboleiros, mas so para quem ja e membro.
-- Idempotente.

begin;

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9]{16}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  uses integer not null default 0
);

create unique index if not exists group_invites_one_active
on public.group_invites (group_id) where revoked_at is null;

alter table public.group_invites enable row level security;
revoke all on table public.group_invites from public, anon, authenticated;
grant select on table public.group_invites to authenticated;

drop policy if exists "invites read group admin" on public.group_invites;
create policy "invites read group admin" on public.group_invites for select to authenticated
using (private.is_group_admin(group_id));

-- Admin: o link ativo do grupo (cria se nao houver; p_renew anula o atual e cria outro).
create or replace function public.get_group_invite(p_group_id uuid, p_renew boolean default false)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if not private.is_group_admin(p_group_id) then
    raise exception 'group_admin_required' using errcode = '42501';
  end if;
  if coalesce(p_renew, false) then
    update public.group_invites set revoked_at = now() where group_id = p_group_id and revoked_at is null;
  end if;
  select code into v_code from public.group_invites where group_id = p_group_id and revoked_at is null;
  if v_code is null then
    v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);
    insert into public.group_invites (group_id, code, created_by) values (p_group_id, v_code, (select auth.uid()));
  end if;
  return v_code;
end;
$$;

-- Qualquer pessoa com o link ve o nome do grupo (para saber onde vai entrar).
create or replace function public.preview_group_invite(p_code text)
returns table (group_name text, valid boolean, already_member boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select grp.name, true, coalesce(private.is_group_member(grp.id), false)
  from public.group_invites as invite
  join public.groups as grp on grp.id = invite.group_id
  where invite.code = lower(btrim(p_code)) and invite.revoked_at is null
  union all
  select null, false, false
  where not exists (
    select 1 from public.group_invites
    where code = lower(btrim(p_code)) and revoked_at is null
  );
$$;

create or replace function public.accept_group_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_invite public.group_invites%rowtype;
  v_inserted integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  select * into v_invite from public.group_invites
  where code = lower(btrim(p_code)) and revoked_at is null;
  if not found then
    raise exception 'invite_not_valid' using errcode = 'P0001';
  end if;
  insert into public.group_members (group_id, user_id, role)
  values (v_invite.group_id, v_user_id, 'player')
  on conflict (group_id, user_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    update public.group_invites set uses = uses + 1 where id = v_invite.id;
  end if;
  return v_invite.group_id;
end;
$$;

revoke all on function public.get_group_invite(uuid, boolean) from public, anon;
revoke all on function public.preview_group_invite(text) from public;
revoke all on function public.accept_group_invite(text) from public, anon;
grant execute on function public.get_group_invite(uuid, boolean) to authenticated;
grant execute on function public.preview_group_invite(text) to anon, authenticated;
grant execute on function public.accept_group_invite(text) to authenticated;

-- Membro sem ficha na lista cria a sua: nota provisoria = media do grupo, e fica como pedido de
-- associacao pendente, que o admin aprova em Pedidos (e acerta a nota).
create or replace function public.create_own_player(p_group_id uuid, p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := left(btrim(coalesce(p_name, '')), 40);
  v_rating integer;
  v_player_id text;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if not private.is_group_member(p_group_id) then
    raise exception 'group_member_required' using errcode = '42501';
  end if;
  if char_length(v_name) < 2 then
    raise exception 'name_required' using errcode = '22023';
  end if;
  if exists (select 1 from public.players where group_id = p_group_id and linked_user_id = v_user_id) then
    raise exception 'already_linked' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.player_claims where user_id = v_user_id and status = 'pending') then
    raise exception 'claim_pending' using errcode = 'P0001';
  end if;

  select coalesce(round(avg(overall))::integer, 60) into v_rating
  from public.players where group_id = p_group_id and not is_guest;
  v_player_id := 'p-' || gen_random_uuid()::text;
  insert into public.players (id, name, pace, shooting, passing, dribbling, defending, physical, overall, group_id)
  values (v_player_id, v_name, v_rating, v_rating, v_rating, v_rating, v_rating, v_rating, v_rating, p_group_id);
  insert into public.player_claims (user_id, player_id, status) values (v_user_id, v_player_id, 'pending');
  return v_player_id;
end;
$$;

revoke all on function public.create_own_player(uuid, text) from public, anon;
grant execute on function public.create_own_player(uuid, text) to authenticated;

-- Contas novas ja nao entram sozinhas nos Futeboleiros; so se sincroniza o papel de quem ja e membro.
create or replace function private.profiles_sync_legacy_membership()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    update public.group_members
    set role = case when new.role = 'admin' then 'admin' else 'player' end
    where group_id = private.legacy_group_id() and user_id = new.id and role <> 'owner';
  end if;
  return new;
end;
$$;

commit;
