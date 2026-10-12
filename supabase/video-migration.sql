-- Vídeo do jogo (2026-10-12): ligações a vídeos do YouTube «não listados», vistos dentro da Footer.
-- Só guarda o ID do vídeo, nunca o ficheiro. Uma linha por parte gravada (um jogo pode ter 2+ vídeos).
-- game_start_s: segundo da linha do tempo do tracker em que esta parte começa (0 na 1.ª parte).
-- video_start_s: segundo do vídeo do YouTube que corresponde a game_start_s (0 se o vídeo é o mesmo
-- ficheiro analisado; outro valor se o vídeo enviado tiver um início cortado ou a mais).
-- game_end_s: segundo da análise em que esta parte acaba (opcional); depois disso os tempos ficam sem ▶.
-- Todos os jogadores autenticados veem; só admins acrescentam, mudam ou apagam.

create table if not exists public.game_videos (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id) on delete cascade,
  position integer not null default 1 check (position > 0),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  label text check (char_length(label) <= 60),
  game_start_s numeric not null default 0 check (game_start_s >= 0),
  video_start_s numeric not null default 0 check (video_start_s >= 0),
  game_end_s numeric check (game_end_s is null or game_end_s > game_start_s),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (game_id, position)
);

alter table public.game_videos enable row level security;
revoke all on table public.game_videos from public, anon;
grant select, insert, update, delete on table public.game_videos to authenticated;

drop policy if exists "videos read" on public.game_videos;
create policy "videos read" on public.game_videos for select to authenticated
using (true);

drop policy if exists "videos admin insert" on public.game_videos;
create policy "videos admin insert" on public.game_videos for insert to authenticated
with check ((select public.is_admin()));

drop policy if exists "videos admin update" on public.game_videos;
create policy "videos admin update" on public.game_videos for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "videos admin delete" on public.game_videos;
create policy "videos admin delete" on public.game_videos for delete to authenticated
using ((select public.is_admin()));
