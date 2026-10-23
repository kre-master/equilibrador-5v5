-- Fase 3.0 (2026-10-23): fundacoes multi-grupo, invisiveis para a app atual.
--
-- O que faz:
-- 1. Cria public.groups e public.group_members e o grupo "Futeboleiros".
-- 2. Poe group_id nas tabelas de topo (players, games, events, payments, finance_settings).
--    As restantes tabelas herdam o grupo pelo jogo/jogador/evento a que pertencem.
-- 3. Todos os dados atuais e todas as contas passam a ser dos Futeboleiros; a conta "admin"
--    fica owner e os outros admins ficam admin do grupo.
-- 4. As politicas RLS deixam de usar o admin global e passam a usar o papel no grupo.
-- 5. Corrige duas falhas encontradas em producao:
--    - qualquer conta podia mudar o proprio profiles.role para 'admin';
--    - qualquer conta podia ler os votos MVP crus (quem votou em quem) e alterar o seu voto.
--
-- Transitorio (a remover na 3.1, quando a app souber escolher o grupo):
-- - group_id tem como default o grupo Futeboleiros, para a app continuar a inserir sem o enviar;
-- - profiles.role continua a existir para a app e e sincronizado com group_members dos Futeboleiros;
-- - novas contas entram automaticamente nos Futeboleiros (como hoje veem tudo).
-- - submit_postgame_checkin continua a exigir exatamente um jogador ligado a conta.
--
-- Idempotente: pode correr mais de uma vez.

begin;

-- ---------------------------------------------------------------------------
-- 1. Grupos e membros
-- ---------------------------------------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  visibility text not null default 'private' check (visibility in ('private')),
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('owner', 'admin', 'player')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_idx on public.group_members (user_id);
create unique index if not exists group_members_one_owner on public.group_members (group_id) where role = 'owner';

insert into public.groups (slug, name)
values ('futeboleiros', 'Futeboleiros')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Funcoes de apoio (schema private: nao exposto pela API)
-- ---------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.legacy_group_id()
returns uuid
language sql stable security definer set search_path = ''
as $$ select id from public.groups where slug = 'futeboleiros' $$;

create or replace function private.is_group_member(p_group_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = (select auth.uid())
  )
$$;

create or replace function private.is_group_admin(p_group_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = (select auth.uid()) and role in ('owner', 'admin')
  )
$$;

-- Admin de algum grupo onde a outra conta tambem esta (para ver/gerir perfis).
create or replace function private.is_admin_of_user(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members as me
    join public.group_members as other on other.group_id = me.group_id
    where me.user_id = (select auth.uid()) and me.role in ('owner', 'admin') and other.user_id = p_user_id
  )
$$;

revoke all on function private.legacy_group_id() from public, anon;
revoke all on function private.is_group_member(uuid) from public, anon;
revoke all on function private.is_group_admin(uuid) from public, anon;
revoke all on function private.is_admin_of_user(uuid) from public, anon;
grant execute on function private.legacy_group_id() to authenticated;
grant execute on function private.is_group_member(uuid) to authenticated;
grant execute on function private.is_group_admin(uuid) to authenticated;
grant execute on function private.is_admin_of_user(uuid) to authenticated;

-- O admin global passa a significar "admin dos Futeboleiros", ja nao profiles.role.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select private.is_group_admin(private.legacy_group_id()) $$;

-- ---------------------------------------------------------------------------
-- 3. group_id nas tabelas de topo
-- ---------------------------------------------------------------------------

alter table public.players add column if not exists group_id uuid references public.groups(id) on delete restrict;
alter table public.games add column if not exists group_id uuid references public.groups(id) on delete restrict;
alter table public.events add column if not exists group_id uuid references public.groups(id) on delete restrict;
alter table public.payments add column if not exists group_id uuid references public.groups(id) on delete restrict;
alter table public.finance_settings add column if not exists group_id uuid references public.groups(id) on delete restrict;

update public.players set group_id = private.legacy_group_id() where group_id is null;
update public.games set group_id = private.legacy_group_id() where group_id is null;
update public.events set group_id = private.legacy_group_id() where group_id is null;
update public.payments set group_id = private.legacy_group_id() where group_id is null;
update public.finance_settings set group_id = private.legacy_group_id() where group_id is null;

alter table public.players alter column group_id set default private.legacy_group_id();
alter table public.games alter column group_id set default private.legacy_group_id();
alter table public.events alter column group_id set default private.legacy_group_id();
alter table public.payments alter column group_id set default private.legacy_group_id();
alter table public.finance_settings alter column group_id set default private.legacy_group_id();

alter table public.players alter column group_id set not null;
alter table public.games alter column group_id set not null;
alter table public.events alter column group_id set not null;
alter table public.payments alter column group_id set not null;
alter table public.finance_settings alter column group_id set not null;

create index if not exists players_group_idx on public.players (group_id);
create index if not exists games_group_date_idx on public.games (group_id, date desc);
create index if not exists events_group_starts_idx on public.events (group_id, starts_at);
create index if not exists payments_group_idx on public.payments (group_id);
create unique index if not exists finance_settings_one_per_group on public.finance_settings (group_id);

-- Grupo de cada jogador/jogo/evento (criadas depois da coluna group_id existir).
create or replace function private.player_group(p_player_id text)
returns uuid
language sql stable security definer set search_path = ''
as $$ select group_id from public.players where id = p_player_id $$;

create or replace function private.game_group(p_game_id text)
returns uuid
language sql stable security definer set search_path = ''
as $$ select group_id from public.games where id = p_game_id $$;

create or replace function private.event_group(p_event_id text)
returns uuid
language sql stable security definer set search_path = ''
as $$ select group_id from public.events where id = p_event_id $$;

revoke all on function private.player_group(text) from public, anon;
revoke all on function private.game_group(text) from public, anon;
revoke all on function private.event_group(text) from public, anon;
grant execute on function private.player_group(text) to authenticated;
grant execute on function private.game_group(text) to authenticated;
grant execute on function private.event_group(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Membros dos Futeboleiros: todas as contas com perfil ou jogador ligado
-- ---------------------------------------------------------------------------

insert into public.group_members (group_id, user_id, role)
select private.legacy_group_id(), account.user_id, account.role
from (
  select profile.id as user_id, case when profile.role = 'admin' then 'admin' else 'player' end as role
  from public.profiles as profile
  union
  select player.linked_user_id, 'player'
  from public.players as player
  where player.linked_user_id is not null
    and not exists (select 1 from public.profiles where profiles.id = player.linked_user_id)
) as account
where exists (select 1 from auth.users where users.id = account.user_id)
on conflict (group_id, user_id) do nothing;

-- Owner: a conta "admin" (ou, se nao existir, o admin mais antigo). So corre se ainda nao houver owner.
with owner_account as (
  select id from public.profiles
  where role = 'admin'
  order by (lower(username) = 'admin') desc, created_at
  limit 1
)
update public.group_members
set role = 'owner'
where group_id = private.legacy_group_id()
  and user_id = (select id from owner_account)
  and not exists (
    select 1 from public.group_members
    where group_id = private.legacy_group_id() and role = 'owner'
  );

update public.groups
set created_by = (select user_id from public.group_members where group_id = groups.id and role = 'owner')
where slug = 'futeboleiros' and created_by is null;

-- ---------------------------------------------------------------------------
-- 5. profiles.role: so um admin do grupo o muda; e fica sincronizado com group_members
-- ---------------------------------------------------------------------------

create or replace function private.profiles_guard_role()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- Sem auth.uid() e o SQL editor/servidor; numa sessao normal so admins do grupo mudam roles.
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not private.is_group_admin(private.legacy_group_id()) then
    raise exception 'role_change_requires_group_admin' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function private.profiles_sync_legacy_membership()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (private.legacy_group_id(), new.id, case when new.role = 'admin' then 'admin' else 'player' end)
  on conflict (group_id, user_id) do update
    set role = excluded.role
    where public.group_members.role <> 'owner';
  return new;
end;
$$;

revoke all on function private.profiles_guard_role() from public, anon, authenticated;
revoke all on function private.profiles_sync_legacy_membership() from public, anon, authenticated;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
before update of role on public.profiles
for each row execute function private.profiles_guard_role();

drop trigger if exists profiles_sync_legacy_membership on public.profiles;
create trigger profiles_sync_legacy_membership
after insert or update of role on public.profiles
for each row execute function private.profiles_sync_legacy_membership();

-- ---------------------------------------------------------------------------
-- 6. Permissoes de tabela
-- ---------------------------------------------------------------------------

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
revoke all on table public.groups from public, anon, authenticated;
revoke all on table public.group_members from public, anon, authenticated;
grant select on table public.groups to authenticated;
grant select on table public.group_members to authenticated;

-- Votos MVP: so leitura do proprio voto; o voto entra pelo RPC submit_postgame_checkin e nao se altera.
revoke all on table public.game_mvp_votes from anon;
revoke insert, update, truncate on table public.game_mvp_votes from authenticated;

-- ---------------------------------------------------------------------------
-- 7. Politicas RLS por grupo
-- ---------------------------------------------------------------------------

-- groups / group_members
drop policy if exists "groups read member" on public.groups;
create policy "groups read member" on public.groups for select to authenticated
using (private.is_group_member(id));

drop policy if exists "group members read own or same group" on public.group_members;
create policy "group members read own or same group" on public.group_members for select to authenticated
using (user_id = (select auth.uid()) or private.is_group_member(group_id));

-- profiles
drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.is_admin_of_user(id));

drop policy if exists "profiles update self or admin" on public.profiles;
create policy "profiles update self or admin" on public.profiles for update to authenticated
using (id = (select auth.uid()) or private.is_admin_of_user(id))
with check (id = (select auth.uid()) or private.is_admin_of_user(id));

-- player_claims
drop policy if exists "claims read own or admin" on public.player_claims;
create policy "claims read own or admin" on public.player_claims for select to authenticated
using (user_id = (select auth.uid()) or private.is_group_admin(private.player_group(player_id)));

drop policy if exists "claims insert own" on public.player_claims;
create policy "claims insert own" on public.player_claims for insert to authenticated
with check (user_id = (select auth.uid()) and private.is_group_member(private.player_group(player_id)));

drop policy if exists "claims update admin" on public.player_claims;
create policy "claims update admin" on public.player_claims for update to authenticated
using (private.is_group_admin(private.player_group(player_id)))
with check (private.is_group_admin(private.player_group(player_id)));

-- players
drop policy if exists "authenticated players read" on public.players;
create policy "authenticated players read" on public.players for select to authenticated
using (private.is_group_member(group_id));

drop policy if exists "admin players insert" on public.players;
create policy "admin players insert" on public.players for insert to authenticated
with check (private.is_group_admin(group_id));

drop policy if exists "admin players update" on public.players;
create policy "admin players update" on public.players for update to authenticated
using (private.is_group_admin(group_id))
with check (private.is_group_admin(group_id));

drop policy if exists "admin players delete" on public.players;
create policy "admin players delete" on public.players for delete to authenticated
using (private.is_group_admin(group_id));
-- "players update own photo" fica igual (linked_user_id = auth.uid(), so colunas da foto).

-- games
drop policy if exists "authenticated games read" on public.games;
create policy "authenticated games read" on public.games for select to authenticated
using (private.is_group_member(group_id));

drop policy if exists "admin games insert" on public.games;
create policy "admin games insert" on public.games for insert to authenticated
with check (private.is_group_admin(group_id));

drop policy if exists "admin games update" on public.games;
create policy "admin games update" on public.games for update to authenticated
using (private.is_group_admin(group_id))
with check (private.is_group_admin(group_id));

drop policy if exists "admin games delete" on public.games;
create policy "admin games delete" on public.games for delete to authenticated
using (private.is_group_admin(group_id));

-- events
drop policy if exists "authenticated events read" on public.events;
create policy "authenticated events read" on public.events for select to authenticated
using (private.is_group_member(group_id));

drop policy if exists "admin events insert" on public.events;
create policy "admin events insert" on public.events for insert to authenticated
with check (private.is_group_admin(group_id));

drop policy if exists "admin events update" on public.events;
create policy "admin events update" on public.events for update to authenticated
using (private.is_group_admin(group_id))
with check (private.is_group_admin(group_id));

drop policy if exists "admin events delete" on public.events;
create policy "admin events delete" on public.events for delete to authenticated
using (private.is_group_admin(group_id));

-- event_responses: admin do grupo, ou o proprio jogador ligado (do mesmo grupo do evento)
drop policy if exists "authenticated event responses read" on public.event_responses;
create policy "authenticated event responses read" on public.event_responses for select to authenticated
using (private.is_group_member(private.event_group(event_id)));

drop policy if exists "players respond to events" on public.event_responses;
create policy "players respond to events" on public.event_responses for insert to authenticated
with check (
  private.is_group_admin(private.event_group(event_id))
  or exists (
    select 1 from public.players
    where players.id = player_id
      and players.linked_user_id = (select auth.uid())
      and players.group_id = private.event_group(event_id)
  )
);

drop policy if exists "players update event responses" on public.event_responses;
create policy "players update event responses" on public.event_responses for update to authenticated
using (
  private.is_group_admin(private.event_group(event_id))
  or exists (
    select 1 from public.players
    where players.id = player_id
      and players.linked_user_id = (select auth.uid())
      and players.group_id = private.event_group(event_id)
  )
)
with check (
  private.is_group_admin(private.event_group(event_id))
  or exists (
    select 1 from public.players
    where players.id = player_id
      and players.linked_user_id = (select auth.uid())
      and players.group_id = private.event_group(event_id)
  )
);

-- payments / finance_settings
drop policy if exists "admin payments read" on public.payments;
create policy "admin payments read" on public.payments for select to authenticated
using (private.is_group_admin(group_id));

drop policy if exists "admin payments insert" on public.payments;
create policy "admin payments insert" on public.payments for insert to authenticated
with check (private.is_group_admin(group_id));

drop policy if exists "admin payments update" on public.payments;
create policy "admin payments update" on public.payments for update to authenticated
using (private.is_group_admin(group_id))
with check (private.is_group_admin(group_id));

drop policy if exists "admin payments delete" on public.payments;
create policy "admin payments delete" on public.payments for delete to authenticated
using (private.is_group_admin(group_id));

drop policy if exists "admin finance settings read" on public.finance_settings;
create policy "admin finance settings read" on public.finance_settings for select to authenticated
using (private.is_group_admin(group_id));

drop policy if exists "admin finance settings insert" on public.finance_settings;
create policy "admin finance settings insert" on public.finance_settings for insert to authenticated
with check (private.is_group_admin(group_id));

drop policy if exists "admin finance settings update" on public.finance_settings;
create policy "admin finance settings update" on public.finance_settings for update to authenticated
using (private.is_group_admin(group_id))
with check (private.is_group_admin(group_id));

-- attendance_overrides / game_finance_overrides (grupo do jogo)
drop policy if exists "admin attendance overrides read" on public.attendance_overrides;
create policy "admin attendance overrides read" on public.attendance_overrides for select to authenticated
using (private.is_group_admin(private.game_group(game_id)));

drop policy if exists "admin attendance overrides insert" on public.attendance_overrides;
create policy "admin attendance overrides insert" on public.attendance_overrides for insert to authenticated
with check (private.is_group_admin(private.game_group(game_id)));

drop policy if exists "admin attendance overrides update" on public.attendance_overrides;
create policy "admin attendance overrides update" on public.attendance_overrides for update to authenticated
using (private.is_group_admin(private.game_group(game_id)))
with check (private.is_group_admin(private.game_group(game_id)));

drop policy if exists "admin attendance overrides delete" on public.attendance_overrides;
create policy "admin attendance overrides delete" on public.attendance_overrides for delete to authenticated
using (private.is_group_admin(private.game_group(game_id)));

drop policy if exists "admin game finance overrides read" on public.game_finance_overrides;
create policy "admin game finance overrides read" on public.game_finance_overrides for select to authenticated
using (private.is_group_admin(private.game_group(game_id)));

drop policy if exists "admin game finance overrides insert" on public.game_finance_overrides;
create policy "admin game finance overrides insert" on public.game_finance_overrides for insert to authenticated
with check (private.is_group_admin(private.game_group(game_id)));

drop policy if exists "admin game finance overrides update" on public.game_finance_overrides;
create policy "admin game finance overrides update" on public.game_finance_overrides for update to authenticated
using (private.is_group_admin(private.game_group(game_id)))
with check (private.is_group_admin(private.game_group(game_id)));

drop policy if exists "admin game finance overrides delete" on public.game_finance_overrides;
create policy "admin game finance overrides delete" on public.game_finance_overrides for delete to authenticated
using (private.is_group_admin(private.game_group(game_id)));

-- game_mvp_votes: confidencial. Cada um le so o seu voto; contagens so pelo RPC agregado.
drop policy if exists "mvp votes read authenticated" on public.game_mvp_votes;
drop policy if exists "mvp votes update linked player" on public.game_mvp_votes;
drop policy if exists "mvp votes insert linked player" on public.game_mvp_votes;
drop policy if exists "mvp votes read own" on public.game_mvp_votes;
create policy "mvp votes read own" on public.game_mvp_votes for select to authenticated
using (
  exists (
    select 1 from public.players
    where players.id = voter_player_id and players.linked_user_id = (select auth.uid())
  )
);

drop policy if exists "mvp votes delete admin" on public.game_mvp_votes;
create policy "mvp votes delete admin" on public.game_mvp_votes for delete to authenticated
using (private.is_group_admin(private.game_group(game_id)));

-- player_form_snapshots
drop policy if exists "form snapshots read own or admin" on public.player_form_snapshots;
create policy "form snapshots read own or admin" on public.player_form_snapshots for select to authenticated
using (
  private.is_group_admin(private.player_group(player_id))
  or exists (
    select 1 from public.players
    where players.id = player_id and players.linked_user_id = (select auth.uid())
  )
);

drop policy if exists "form snapshots write admin" on public.player_form_snapshots;
create policy "form snapshots write admin" on public.player_form_snapshots for all to authenticated
using (private.is_group_admin(private.player_group(player_id)))
with check (private.is_group_admin(private.player_group(player_id)));

-- game_feedback
drop policy if exists "feedback read own or admin" on public.game_feedback;
create policy "feedback read own or admin" on public.game_feedback for select to authenticated
using (user_id = (select auth.uid()) or private.is_group_admin(private.game_group(game_id)));

-- game_tracking_results
drop policy if exists "tracking read published or admin" on public.game_tracking_results;
create policy "tracking read published or admin" on public.game_tracking_results for select to authenticated
using (
  (status = 'published' and private.is_group_member(private.game_group(game_id)))
  or private.is_group_admin(private.game_group(game_id))
);

drop policy if exists "tracking admin insert" on public.game_tracking_results;
create policy "tracking admin insert" on public.game_tracking_results for insert to authenticated
with check (private.is_group_admin(private.game_group(game_id)));

drop policy if exists "tracking admin update" on public.game_tracking_results;
create policy "tracking admin update" on public.game_tracking_results for update to authenticated
using (private.is_group_admin(private.game_group(game_id)))
with check (private.is_group_admin(private.game_group(game_id)));

drop policy if exists "tracking admin delete" on public.game_tracking_results;
create policy "tracking admin delete" on public.game_tracking_results for delete to authenticated
using (private.is_group_admin(private.game_group(game_id)));

-- game_videos
drop policy if exists "videos read" on public.game_videos;
create policy "videos read" on public.game_videos for select to authenticated
using (private.is_group_member(private.game_group(game_id)));

drop policy if exists "videos admin insert" on public.game_videos;
create policy "videos admin insert" on public.game_videos for insert to authenticated
with check (private.is_group_admin(private.game_group(game_id)));

drop policy if exists "videos admin update" on public.game_videos;
create policy "videos admin update" on public.game_videos for update to authenticated
using (private.is_group_admin(private.game_group(game_id)))
with check (private.is_group_admin(private.game_group(game_id)));

drop policy if exists "videos admin delete" on public.game_videos;
create policy "videos admin delete" on public.game_videos for delete to authenticated
using (private.is_group_admin(private.game_group(game_id)));

-- game_video_bookmarks
drop policy if exists "bookmarks read" on public.game_video_bookmarks;
create policy "bookmarks read" on public.game_video_bookmarks for select to authenticated
using (private.is_group_member(private.game_group(game_id)));

drop policy if exists "bookmarks insert own" on public.game_video_bookmarks;
create policy "bookmarks insert own" on public.game_video_bookmarks for insert to authenticated
with check (created_by = (select auth.uid()) and private.is_group_member(private.game_group(game_id)));

drop policy if exists "bookmarks delete own or admin" on public.game_video_bookmarks;
create policy "bookmarks delete own or admin" on public.game_video_bookmarks for delete to authenticated
using (created_by = (select auth.uid()) or private.is_group_admin(private.game_group(game_id)));

-- player_private_metrics e feature_rollouts ficam iguais (dados do proprio / flag global).

-- ---------------------------------------------------------------------------
-- 8. Contagens MVP so dos jogos dos grupos de quem pergunta
-- ---------------------------------------------------------------------------

create or replace function public.mvp_vote_counts()
returns table (
  game_id text,
  candidate_player_id text,
  vote_count bigint
)
language sql
security definer
set search_path = ''
as $$
  select vote.game_id, vote.candidate_player_id, count(*)::bigint as vote_count
  from public.game_mvp_votes as vote
  where private.is_group_member(private.game_group(vote.game_id))
  group by vote.game_id, vote.candidate_player_id;
$$;

revoke all on function public.mvp_vote_counts() from public, anon;
grant execute on function public.mvp_vote_counts() to authenticated;

commit;
