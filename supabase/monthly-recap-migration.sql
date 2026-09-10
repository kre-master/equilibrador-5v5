create table if not exists public.player_private_metrics (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references public.players(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,2) not null check (weight_kg between 30 and 250),
  effective_from date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists player_private_metrics_user_effective_idx
on public.player_private_metrics (user_id, effective_from desc);
create index if not exists player_private_metrics_player_effective_idx
on public.player_private_metrics (player_id, effective_from desc);

alter table public.player_private_metrics enable row level security;
revoke all on table public.player_private_metrics from public, anon;
grant select, insert on table public.player_private_metrics to authenticated;

drop policy if exists "private metrics own read" on public.player_private_metrics;
create policy "private metrics own read" on public.player_private_metrics for select to authenticated
using (user_id = (select auth.uid()) and exists (
  select 1 from public.players player where player.id = player_id and player.linked_user_id = (select auth.uid())
));

drop policy if exists "private metrics own insert" on public.player_private_metrics;
create policy "private metrics own insert" on public.player_private_metrics for insert to authenticated
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.players player where player.id = player_id and player.linked_user_id = (select auth.uid())
));
