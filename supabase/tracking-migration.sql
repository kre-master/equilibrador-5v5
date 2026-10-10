-- Tracking de vídeo v1 (beta): resultados do tracker por jogo, importados e publicados por um admin.
-- Um resultado por revisão; no máximo um publicado por jogo. Os jogadores autenticados leem só os
-- publicados; rascunhos e escrita são apenas para admin. Não altera games, players, votos ou cartas.
-- O conteúdo (result) é o resumo do tracker (métricas, mapas de calor de 1 m, equipas), sem vídeo,
-- trajetórias densas nem embeddings. mapping liga cada etiqueta do vídeo a players.id, confirmado por admin.

create table if not exists public.game_tracking_results (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id) on delete cascade,
  revision integer not null check (revision > 0),
  schema_version text not null check (schema_version = 'footer.tracking-result.v1'),
  run_id text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  result jsonb not null,
  mapping jsonb not null default '{}'::jsonb,
  source_file text,
  imported_by uuid default auth.uid() references auth.users(id) on delete set null,
  imported_at timestamptz not null default now(),
  published_at timestamptz,
  unique (game_id, revision),
  check (octet_length(result::text) < 1000000)
);

create unique index if not exists game_tracking_results_one_published_idx
on public.game_tracking_results (game_id) where status = 'published';

alter table public.game_tracking_results enable row level security;
revoke all on table public.game_tracking_results from public, anon;
grant select, insert, update, delete on table public.game_tracking_results to authenticated;

drop policy if exists "tracking read published or admin" on public.game_tracking_results;
create policy "tracking read published or admin" on public.game_tracking_results for select to authenticated
using (status = 'published' or (select public.is_admin()));

drop policy if exists "tracking admin insert" on public.game_tracking_results;
create policy "tracking admin insert" on public.game_tracking_results for insert to authenticated
with check ((select public.is_admin()));

drop policy if exists "tracking admin update" on public.game_tracking_results;
create policy "tracking admin update" on public.game_tracking_results for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "tracking admin delete" on public.game_tracking_results;
create policy "tracking admin delete" on public.game_tracking_results for delete to authenticated
using ((select public.is_admin()));
