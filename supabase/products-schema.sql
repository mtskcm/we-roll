-- WEROL: products table — populated from a Heureka/Google-Shopping XML feed
-- (Dognet affiliate feeds use the same structure). Run once in the Supabase
-- SQL Editor. The importer (scripts/ingest-feed.mjs / edge function) writes
-- rows with the service-role key; the app reads them with the public anon key.

-- 1. Table
create table if not exists public.products (
  id             text primary key,          -- "<shop>:<ITEM_ID>" (stable, collision-free)
  ext_id         text not null,             -- raw ITEM_ID from the feed
  shop           text not null,             -- shop / advertiser name
  brand          text,                      -- MANUFACTURER
  name           text not null,             -- PRODUCTNAME
  description     text,
  price_current  numeric(10,2),             -- PRICE_VAT
  price_original numeric(10,2),             -- sale "before" price, if any
  currency       text not null default 'EUR',
  image_url      text,                      -- IMGURL
  image_alt_url  text,                      -- IMGURL_ALTERNATIVE
  buy_url        text not null,             -- URL (later wrapped with affiliate deeplink)
  category       text,                      -- mapped to our CategoryId
  category_raw   text,                      -- original CATEGORYTEXT
  ean            text,
  in_stock       boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_shop_idx     on public.products (shop);
create index if not exists products_updated_idx  on public.products (updated_at desc);

-- 2. Row Level Security: public can READ, only the service role can write.
alter table public.products enable row level security;

drop policy if exists "products public read" on public.products;
create policy "products public read"
  on public.products for select
  to anon, authenticated
  using (true);

-- (No insert/update/delete policy → anon/authenticated cannot write.
--  The importer uses the service-role key, which bypasses RLS.)

-- 3. Keep updated_at fresh on every upsert.
create or replace function public.products_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch
  before update on public.products
  for each row execute function public.products_touch_updated_at();
