create extension if not exists pgcrypto;

create table if not exists public.events (
  id text primary key,
  title text not null,
  sport text not null default 'futsal',
  starts_at timestamptz not null,
  location text default '',
  min_players integer not null default 10,
  max_players integer not null default 13,
  status text not null default 'open' check (status in ('draft', 'open', 'locked', 'completed', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.event_responses (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  status text not null check (status in ('going', 'maybe', 'not_going')),
  updated_at timestamptz default now()
);

create unique index if not exists event_responses_one_per_player
on public.event_responses (event_id, player_id);

grant select on public.events to anon, authenticated;
grant select on public.event_responses to anon, authenticated;
grant insert, update, delete on public.events to authenticated;
grant insert, update on public.event_responses to authenticated;

alter table public.events enable row level security;
alter table public.event_responses enable row level security;
