-- profiles-schema.sql — WEROL user profiles for real multi-account auth.
-- Run this once in the Supabase SQL editor. Mirrors the RLS style of
-- products-schema.sql and the trigger style of send-welcome-email.sql.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text not null,
  handle      text not null unique,
  initials    text not null,
  avatar_url  text,
  bio         text,
  gender      text,                       -- 'female' | 'male' | null
  preferences jsonb not null default '{}'::jsonb,  -- onboarding: style/sizes/brands/categories
  joined_at   timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_handle_idx on public.profiles (handle);

alter table public.profiles enable row level security;

-- public read (community feed shows owners); each user writes only their own row
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles
  for select to anon, authenticated using (true);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up. Handle defaults to
-- the email prefix + 4 chars of the uuid so it's unique; onboarding can change it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, handle, initials, gender)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(
      new.raw_user_meta_data->>'handle',
      split_part(new.email, '@', 1) || left(replace(new.id::text, '-', ''), 4)
    ),
    coalesce(new.raw_user_meta_data->>'initials', upper(left(split_part(new.email, '@', 1), 2))),
    new.raw_user_meta_data->>'gender'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
