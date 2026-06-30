-- outfits-schema.sql — published community outfits (the FITS feed).
-- Run once in the Supabase SQL editor (after profiles-schema.sql).
-- Each outfit stores the FASHN-dressed figure SNAPSHOT (image_url) + tagged pieces.

create table if not exists public.outfits (
  id                 text primary key,                 -- "fit-<ts>-<uid8>"
  user_id            uuid not null references public.profiles (id) on delete cascade,
  name               text not null default 'FIT',
  caption            text,
  image_url          text not null,                    -- dressed-figure snapshot (Storage URL)
  tagged_product_ids text[] not null default '{}',     -- product.id strings
  likes_count        int not null default 0,
  created_at         timestamptz not null default now()
);

create index if not exists outfits_user_id_idx on public.outfits (user_id);
create index if not exists outfits_created_at_idx on public.outfits (created_at desc);

alter table public.outfits enable row level security;

drop policy if exists "outfits public read" on public.outfits;
create policy "outfits public read" on public.outfits
  for select to anon, authenticated using (true);

drop policy if exists "outfits insert own" on public.outfits;
create policy "outfits insert own" on public.outfits
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "outfits update own" on public.outfits;
create policy "outfits update own" on public.outfits
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "outfits delete own" on public.outfits;
create policy "outfits delete own" on public.outfits
  for delete to authenticated using (auth.uid() = user_id);

-- Public Storage bucket for the dressed-figure snapshots.
insert into storage.buckets (id, name, public)
values ('outfits', 'outfits', true)
on conflict (id) do nothing;

drop policy if exists "outfits storage public read" on storage.objects;
create policy "outfits storage public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'outfits');

drop policy if exists "outfits storage insert own" on storage.objects;
create policy "outfits storage insert own" on storage.objects
  for insert to authenticated with check (bucket_id = 'outfits' and owner = auth.uid());
