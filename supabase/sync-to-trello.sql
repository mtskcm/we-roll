-- WEROL: sync new signups → Trello cards automatically
-- Beží ako trigger po každom INSERT do public.signups
-- Používa pg_net (Supabase má by default) na async HTTP POST na Trello API
--
-- ⚠️ PRED SPUSTENÍM: Nahraď placeholders v sekcii 2 reálnymi hodnotami:
--   YOUR_TRELLO_API_KEY    — z https://trello.com/power-ups/admin/
--   YOUR_TRELLO_TOKEN      — zo svojej app stránky (link "Token")
--   YOUR_TRELLO_LIST_ID    — ID listu kam má padať každý nový signup
--
-- Bezpečnejšia alternatíva (TODO): presunúť kredentialy do Supabase Vault
-- a v triggeri čítať cez vault.read_secret('trello_key')

-- 1. Povol pg_net rozšírenie (ak ešte nie je)
create extension if not exists pg_net;

-- 2. Trigger funkcia
create or replace function public.sync_signup_to_trello()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  trello_key   text := 'YOUR_TRELLO_API_KEY';
  trello_token text := 'YOUR_TRELLO_TOKEN';
  trello_list  text := 'YOUR_TRELLO_LIST_ID';
  request_id   bigint;
begin
  -- Async HTTP POST na Trello — vráti request_id, neblokujeme insert
  select net.http_post(
    url := 'https://api.trello.com/1/cards?key=' || trello_key || '&token=' || trello_token,
    body := jsonb_build_object(
      'idList', trello_list,
      'name', new.email,
      'desc', E'**Source:** ' || coalesce(new.source, 'unknown')
             || E'\n**Created:** ' || new.created_at::text
             || E'\n**User-Agent:** ' || coalesce(new.user_agent, 'n/a')
             || E'\n**Supabase row ID:** ' || new.id::text,
      'pos', 'top'
    ),
    headers := jsonb_build_object('Content-Type', 'application/json')
  ) into request_id;

  return new;
end;
$$;

-- 3. Trigger — pripni funkciu na AFTER INSERT
drop trigger if exists on_signup_to_trello on public.signups;
create trigger on_signup_to_trello
  after insert on public.signups
  for each row
  execute function public.sync_signup_to_trello();

-- 4. Test (zakomentované — odkomentuj a spusti raz na overenie že to funguje)
-- insert into public.signups (email, source) values ('test-trigger@example.com', 'sql_test');

-- 5. (Voliteľné) Helper view na monitoring odoslaných requestov
-- Spusti pre debug ak by nieco nefungovalo:
-- select * from net._http_response order by id desc limit 5;
