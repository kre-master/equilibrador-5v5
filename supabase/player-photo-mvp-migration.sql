alter table public.games
add column if not exists score_saved_at timestamptz;

grant update (photo_data_url, updated_at) on public.players to authenticated;

drop policy if exists "players update own photo" on public.players;
create policy "players update own photo"
on public.players for update
to authenticated
using (linked_user_id = auth.uid())
with check (linked_user_id = auth.uid());
