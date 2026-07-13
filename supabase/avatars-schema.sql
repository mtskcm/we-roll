-- avatars-schema.sql — public Storage bucket for profile photos (bio pictures).
-- Run once in the Supabase SQL editor. (profiles.avatar_url already exists.)

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'avatars');

drop policy if exists "avatars insert own" on storage.objects;
create policy "avatars insert own" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects
  for update to authenticated using (bucket_id = 'avatars' and owner = auth.uid());
