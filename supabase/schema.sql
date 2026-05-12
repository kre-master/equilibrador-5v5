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
  updated_at timestamptz default now()
);

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
alter table public.games enable row level security;

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
with check (true);

drop policy if exists "admin players update" on public.players;
create policy "admin players update"
on public.players for update
to authenticated
using (true)
with check (true);

drop policy if exists "admin players delete" on public.players;
create policy "admin players delete"
on public.players for delete
to authenticated
using (true);

drop policy if exists "admin games insert" on public.games;
create policy "admin games insert"
on public.games for insert
to authenticated
with check (true);

drop policy if exists "admin games update" on public.games;
create policy "admin games update"
on public.games for update
to authenticated
using (true)
with check (true);

drop policy if exists "admin games delete" on public.games;
create policy "admin games delete"
on public.games for delete
to authenticated
using (true);
