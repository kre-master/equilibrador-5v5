-- Momentos (bookmarks) nos videos dos jogos (2026-10-15).
-- Qualquer jogador autenticado marca um momento com comentario enquanto ve o video;
-- clicar no momento toca so o pedaco entre start_s e end_s (segundos do video do YouTube).
-- Todos os autenticados veem; cada um apaga os seus; admins apagam qualquer um.

create table if not exists public.game_video_bookmarks (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id) on delete cascade,
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  moment_s numeric not null check (moment_s >= 0),
  start_s numeric not null check (start_s >= 0),
  end_s numeric not null check (end_s > start_s and end_s - start_s <= 120),
  note text not null check (char_length(btrim(note)) between 1 and 140),
  author_name text check (char_length(author_name) <= 60),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists game_video_bookmarks_game_idx on public.game_video_bookmarks (game_id, moment_s);
create index if not exists game_video_bookmarks_recent_idx on public.game_video_bookmarks (created_at desc);

alter table public.game_video_bookmarks enable row level security;
revoke all on table public.game_video_bookmarks from public, anon;
grant select, insert, delete on table public.game_video_bookmarks to authenticated;

drop policy if exists "bookmarks read" on public.game_video_bookmarks;
create policy "bookmarks read" on public.game_video_bookmarks for select to authenticated
using (true);

drop policy if exists "bookmarks insert own" on public.game_video_bookmarks;
create policy "bookmarks insert own" on public.game_video_bookmarks for insert to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists "bookmarks delete own or admin" on public.game_video_bookmarks;
create policy "bookmarks delete own or admin" on public.game_video_bookmarks for delete to authenticated
using (created_by = (select auth.uid()) or (select public.is_admin()));
