create table if not exists public.players (
  id text primary key,
  name text not null,
  pace integer not null check (pace between 0 and 100),
  shooting integer not null check (shooting between 0 and 100),
  passing integer not null check (passing between 0 and 100),
  dribbling integer not null check (dribbling between 0 and 100),
  defending integer not null check (defending between 0 and 100),
  physical integer not null check (physical between 0 and 100),
  overall integer not null check (overall between 0 and 100),
  photo_data_url text default '',
  linked_user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz default now()
);

alter table public.players
add column if not exists linked_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'player' check (role in ('player', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.player_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

create unique index if not exists player_claims_one_pending_per_user
on public.player_claims (user_id)
where status = 'pending';

grant select on public.players to anon, authenticated;
grant select on public.games to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.player_claims to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

create or replace function public.has_any_profile()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles);
$$;

create table if not exists public.games (
  id text primary key,
  date timestamptz not null,
  status text not null check (status in ('open', 'finished')),
  team_a text[] not null default '{}',
  team_b text[] not null default '{}',
  bench_a text[] not null default '{}',
  bench_b text[] not null default '{}',
  score_a integer,
  score_b integer,
  notes text default '',
  updated_at timestamptz default now()
);

alter table public.players enable row level security;
alter table public.profiles enable row level security;
alter table public.player_claims enable row level security;
alter table public.games enable row level security;

drop policy if exists "profiles read authenticated" on public.profiles;
create policy "profiles read authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self"
on public.profiles for insert
to authenticated
with check (id = auth.uid() and (role = 'player' or not public.has_any_profile()));

drop policy if exists "profiles update self or admin" on public.profiles;
create policy "profiles update self or admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "claims read own or admin" on public.player_claims;
create policy "claims read own or admin"
on public.player_claims for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "claims insert own" on public.player_claims;
create policy "claims insert own"
on public.player_claims for insert
to authenticated
with check (true);

drop policy if exists "claims update admin" on public.player_claims;
create policy "claims update admin"
on public.player_claims for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public players read" on public.players;
create policy "public players read"
on public.players for select
using (true);

drop policy if exists "public games read" on public.games;
create policy "public games read"
on public.games for select
using (true);

drop policy if exists "admin players insert" on public.players;
create policy "admin players insert"
on public.players for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin players update" on public.players;
create policy "admin players update"
on public.players for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin players delete" on public.players;
create policy "admin players delete"
on public.players for delete
to authenticated
using (public.is_admin());

drop policy if exists "admin games insert" on public.games;
create policy "admin games insert"
on public.games for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin games update" on public.games;
create policy "admin games update"
on public.games for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin games delete" on public.games;
create policy "admin games delete"
on public.games for delete
to authenticated
using (public.is_admin());
