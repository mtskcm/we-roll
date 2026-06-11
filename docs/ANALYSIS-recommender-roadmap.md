# WEROL — Product & Recommender Analysis

*Generated via multi-agent workflow (recommender · data pipeline · feature gaps · UX) + synthesis.*

---

# ★ SYNTHESIS (read this first)

# WEROL — Decision-Ready Engineering Briefing
*(1-dev team, pre-launch · prepared for Matúš)*

## 1. TL;DR

- **You have a polished prototype on real data, but the product's core promise — a learning feed — cannot exist yet, because there is zero server-side record of behavior.** Every like/save/search lives only in AsyncStorage on one phone (`feedStore`, `userStore`). The server has nothing to learn from, and you can't even *measure* relevance.
- **The recommender's fuel is logged interactions — and today they don't exist. This is THE strategic point:** until interactions land in Postgres against a stable user id, no algorithm (heuristic *or* ML) can learn, personalize, or be evaluated. Build the logging spine before any ranking cleverness.
- **An IG/TikTok learning feed cannot be trained before users — that's physics, not a gap.** What you *can* ship pre-launch is a strong, demoable **content-based + onboarding-seeded** feed that personalizes from the first tap, while logging every event so the ML trains itself the day users arrive.
- **The feed is static** — `FeedScreen` renders the 226 rows once, in `updated_at.desc` order, identical for everyone; `buildRecommendations` exists but never touches the feed.
- **The catalog is also static and quietly rotting:** the import was a one-time manual run, `in_stock` is hardcoded `true` (bug at `ingest-feed.mjs:104`), removed products never leave. For an affiliate app, stale = broken BUY links = €0 + lost trust.
- **Two prerequisites gate everything:** real Supabase Auth (replaces fake login) → DB-synced interactions. Two store-submission blockers also loom: account deletion and a privacy policy.
- **Sequence is the whole game:** auth → DB-synced interactions → events logging (with dwell) → onboarding taste → content-based ranking. Onboarding or fancy ML before events exist is wasted work.

---

## 2. THE ALGORITHM ANSWER (your core question)

**Can an IG/TikTok-style learning feed be built before real users? Partially — and that's the honest, correct answer.** The *learned* part (collaborative filtering, neural ranker) needs interaction volume you don't have. The *cold-start* part — which is exactly how TikTok/IG themselves start every new user — is fully buildable and demoable now.

**Buildable now (zero user data):** content-based ranking on product attributes (brand, category, price band, color); image+text embeddings (CLIP + sentence-transformers) into pgvector for "more like this"; an onboarding taste-picker that seeds a preference vector from the first tap; popularity prior; rules + diversity caps.
**Needs data (defer):** collaborative filtering ("users who liked X also liked Y"), any learned ranker (GBT/two-tower). These *train themselves* on the events you start logging now.

**The 3-phase plan:**
1. **NOW (no data):** stable user id + `events` table (capture dwell) + content-based/onboarding/popularity ranking behind a `rank_feed` RPC. Swap `data={PRODUCTS}` → `useRankedFeed()`.
2. **SOME data (hundreds–thousands of events):** item-item co-occurrence CF in SQL + pgvector "more like this" + per-user taste vector + session re-ranking; blend in the RPC; `pg_cron` refreshes nightly.
3. **SCALE (10k+ events):** train a gradient-boosted ranker on logged events (label = dwell/like/buy); later graduate to two-tower retrieval. Train offline, serve via Edge Function.

**The ONE thing to build immediately: interaction-events logging against a stable user id.** Why: it is the only irreversible decision. Every day without it is behavioral data you can never recover, and it is the literal training set + evaluation set for everything in Phases 2–3. The ML is the easy part later; the data is the asset. (The card contract — `rank_feed` RPC behind `useRankedFeed()` — never changes across phases; only what's behind it does. **Gold signal = dwell time**, captured in the existing `onViewableItemsChanged` machinery in `FeedScreen.tsx`, ~30 lines.)

**How to test it pre-launch (three layers):**
- **Synthetic personas:** define 6–10 taste vectors ("sneakerhead, €150, Nike/NB"; "minimal monochrome"), simulate sessions against `rank_feed` with a dwell/click model, assert the feed bends toward the persona within N swipes and seen items don't repeat. Validates the full pipeline (log → RPC → feed).
- **Offline replay (once events exist):** hold out each session's last interaction, measure NDCG@k / Recall@k — did the ranker surface the actually-liked item?
- **Closed beta:** 20–50 testers (you, designer, marketing's network); run a v1-popularity vs v2-content A/B (tag every event with `context.algo`); promote a ranker only when it wins on **both** offline NDCG *and* live dwell/D1-D7. Synthetic + offline can mislead; the beta is the reality check.

---

## 3. IS THE FEED STATIC OR LIVE?

**Both the feed and the catalog are static.** The feed is a `FlatList` over the 226 rows fetched once in catalog order, same for everyone (no re-rank, no refetch, no pagination). The catalog itself is a frozen one-time manual import — no cron, no Edge Function exists.

**The fix is two independent jobs, both Supabase-native (`pg_cron` → Edge Function):**
- **Personalized feed** = the `rank_feed` RPC from §2 (do in Phase 1 — it *is* the product).
- **Live catalog** = lift the existing, battle-tested `parseFeed`/`mapItem` logic verbatim from `ingest-feed.mjs` into a `supabase/functions/ingest-feed` Deno function, scheduled every 8h via `pg_cron` + `pg_net`, with a stale-sweep (mark not-seen-this-run rows `stale`) and an `ingest_runs` monitoring table. **Do this as P0 #2** — *before* real users, because an affiliate app serving dead/mispriced BUY links burns money and trust regardless of how good the algorithm is. Also fix the `in_stock=true` bug while you're in there.

---

## 4. WHAT ELSE TO BUILD — sequenced roadmap

Effort: **S** ≤1 day · **M** 2–5 days · **L** 1–2+ wks. Ordered to unblock the recommender ASAP.

### P0 — before real users
1. **Supabase Auth (real)** — **M** — replaces fake `login()`; mints the stable `user_id` every event must join on. Keystone; nothing works without it. *(Mint an anon device-id UUID immediately even before full auth, so logging can start and reconcile later.)*
2. **Automated catalog ingest + stale-sweep + fix `in_stock` bug** — **M** — Edge Function + `pg_cron`; stops burning affiliate revenue/trust on dead links. Independent of auth, can run in parallel.
3. **`events` table + `track()` client logger + RLS** — **M** — append-only behavior log (dwell, like, save, add-to-FIT, share, buy_click, skip, impression; stamp `feed_position` + `context.algo`). **The recommender's fuel; build the moment a user_id exists.**
4. **Dual-write interactions to DB + server-hydrate on login** — **M** — `toggleLike/toggleSaved/saveOutfit` keep snappy local update *and* insert to Postgres. Cross-device survival + server-side recommender input.
5. **Onboarding taste-picker** — **M** — 3-screen style/brand/size flow (or a rapid 10-item swipe round) → seeds preference vector. Solves user cold-start; makes the feed feel smart on first launch. (Today registration hardcodes brands — pure waste.)
6. **`rank_feed` RPC v1 (content + popularity + recency + diversity + ε-explore) behind `useRankedFeed()`** — **L** — swap static `data={PRODUCTS}`. This is the actual product value going live. Keep heuristic; do not block on ML.
7. **Dwell + swipe-away + explicit "not for me"** — **S** — capture the dense negative signals in existing viewability machinery; binary likes are too sparse to learn from.
8. **Loading / empty / error / offline states for the feed** — **M** — now mandatory (network-backed); reviewers test bad networks. `productsStore` currently silently shows mock on error.
9. **Account deletion + privacy policy / store data-disclosure** — **S** — hard App Store / Play rejection + GDPR (you're SK/EU, and now collecting behavioral data). Trivial but gating; don't let it slip.

### P1 — soon after launch
10. **Affiliate wrap at ingest + `buy_click` logging** — **M** — your revenue + strongest preference signal; untracked = unpaid. Wrap server-side (per-shop), keep `buy_url_raw`.
11. **pgvector embeddings computed at ingest** (CLIP + MiniLM, batch over 226) — **M** — unlocks "more like this" + taste vectors; replaces the §2 content term.
12. **Online taste-vector recompute (`pg_cron`)** — **M** — nightly rebuild per-user vector from time-decayed events. **This is the "it learns you" milestone — and it's cheap because the events spine already exists.**
13. **`expo-image` + blurhash placeholder + prefetch next 2–3; `expo-haptics` + double-tap-like** — **S/M** — kills the double-image/BlurView perf hack; a swipe feed with no haptics feels dead.
14. **Real push (`expo-notifications` + Edge Function): price-drop on saved, daily-drop, restock** — **M** — the retention engine; current "live messages" are a fake 15s timer.
15. **Analytics dashboard on `events` + A/B `feed_variant` flag + pull-to-refresh** — **S** — you can't tune the algorithm without measurement; A/B proves ranked-vs-chrono lift.

### P2 — later
16. **Image caching to Storage/CDN (lazy, only surfaced items)** — **M** — perceived-perf polish.
17. **Real FITS community (DB-backed) + user image upload + moderation** — **L** — the defensible UGC + affiliate moat, but premature at 0 users.
18. **Learned ranker (GBT → two-tower) on accumulated events** — **L** — the "real ML"; only earns its complexity after meaningful event volume.

---

## 5. TOP 5 NEXT ACTIONS (in order)

1. **Stand up real Supabase Auth and mint a persistent user_id** (anon device-UUID in `userStore` now, reconcile to auth uid later). Replace the fake `login()` in `SignInScreen`/`userStore`.
2. **Create the `events` table (with `dwell_ms`, `feed_position`, `context.algo`, RLS) and ship a batched `track()` client logger.** Wire dwell capture into `FeedScreen`'s `onViewableItemsChanged`; dual-write likes/saves. This is the irreversible asset — start collecting today.
3. **Automate catalog ingest: lift `parseFeed`/`mapItem` from `ingest-feed.mjs` into a `supabase/functions/ingest-feed` Deno function on `pg_cron` (8h) with a stale-sweep, and fix the hardcoded `in_stock=true` bug.** Stops burning affiliate revenue in parallel with the recommender work.
4. **Build the onboarding taste-picker** writing to the events table (`onboarding_pick`) — seeds the cold-start vector and is your "the feed already adapts to me" demo.
5. **Add the `rank_feed` RPC v1 and replace `data={PRODUCTS}` with `useRankedFeed()` in `FeedScreen`** (content + popularity + recency + diversity + ε-explore), then **validate with 6–10 synthetic personas** before any human touches it.

**Key files:** `app/src/store/userStore.ts` + `app/src/screens/auth/SignInScreen.tsx` (auth), `app/src/store/feedStore.ts` (dual-write + dwell), `app/src/lib/supabase.ts` (mirror read path for event writes/RPC), `app/src/screens/FeedScreen.tsx` (swap `data={PRODUCTS}`), `app/src/data/recommendations.ts` (becomes server ranker v1 logic), `app/scripts/ingest-feed.mjs` (lift into Edge Function; fix `:104`), `supabase/products-schema.sql` (add `events-schema.sql` + `rank_feed` alongside).

---

# 1. Recommender system (full design)

I have everything I need. I now know the exact products schema, the RLS pattern they use, the REST read path, the local-only feed store, the static `data={PRODUCTS}` seam in FeedScreen, the heuristic recommender, and that there are no users/events/edge functions yet. Here is the complete design.

---

# WEROL Personalization & Recommender System — End-to-End Design

Grounded in your actual stack: `public.products` (text PK `"<shop>:<ext_id>"`, RLS public-read/service-write), anon REST read in `lib/supabase.ts`, local-only zustand stores (`feedStore.liked/saved`), static `data={PRODUCTS}` in `FeedScreen.tsx`, heuristic `buildRecommendations`. 226 products, 0 users, fake auth.

---

## 1) How IG Reels / TikTok "For You" actually work

It is **two stages**, not one model. You never score the whole catalog per request.

**Stage A — Candidate generation (retrieval).** Cheaply narrow millions of items to a few hundred. Multiple parallel sources, then union:
- **Collaborative filtering (CF):** "users who liked X also liked Y." Item-item co-occurrence is the workhorse. Pure behavior, no content needed — but useless cold (no behavior yet).
- **Two-tower retrieval:** a *user tower* (history → vector) and an *item tower* (features → vector) trained so dot-product ≈ relevance. Item vectors are precomputed; at serve time you embed the user once and do **ANN** (approximate nearest neighbor) against the item index. This is exactly what **pgvector** gives you in Postgres.
- **Content-based:** match item *attributes/embeddings* to the user's taste profile. The only source that works with zero behavior → **your cold-start lifeline**.

**Stage B — Ranking.** A heavier model scores the ~hundreds of candidates and orders them. TikTok-class systems use **multi-task** models predicting several probabilities at once (p(watch-to-end), p(like), p(save), p(share), p(skip)) and combine them into one utility score.

**The gold signal is implicit, not explicit.** Likes are sparse and biased; **dwell / watch time is dense and honest**. On a full-screen one-item-per-screen feed (yours), **how long a card stays on screen before the user swipes** is the single most predictive signal. A swipe-away in <800ms is a strong negative; lingering 6s + tapping BUY is a strong positive. Capturing dwell is the highest-leverage thing you can build now.

**Real-time online learning.** TikTok updates user state within the session — your last few swipes immediately reshape the next cards. You don't need streaming ML for this; **session-level re-ranking** (down-weight just-skipped categories, up-weight just-liked ones) captures most of the value.

**Exploration vs exploitation.** Pure exploitation collapses into a filter bubble and starves catalog coverage. Inject exploration: ε-greedy (e.g. 10–15% random/under-shown items) or UCB/Thompson bandits later. Critical for you — with 226 items you must show the long tail or users see the same 20 cards.

**Diversity.** Consecutive near-identical items kill the feed. Apply **MMR-style diversity penalty** or category/brand caps in a sliding window (e.g. no 3-in-a-row same category) as a post-ranking pass.

---

## 2) Cold-start reality for WEROL

With 0 users and 226 items, **CF and learned rankers are impossible** (no interactions to learn from). What is **fully buildable and demoable now**:

| Lever | How | Demoable pre-launch? |
|---|---|---|
| **Content-based on attributes** | brand, category, price band, color → similarity to taste profile | ✅ today, no ML |
| **Image + text embeddings** | CLIP on `image_url`, sentence-transformers on `name`/`brand`/`description` → pgvector; "more like this" | ✅ one batch job over 226 rows |
| **Onboarding taste-picker** | 8-card "tap what you like" on first launch → seeds preference vector. **This is your synthetic first interaction** and solves user cold-start | ✅ high impact, low effort |
| **Popularity prior** | your `likes` field (or real events once flowing) as a baseline ranker | ✅ today |
| **Rules + diversity** | in-stock filter, price-band match to budget, category caps | ✅ today |

The honest framing for investors/beta: *"We can't have a learned algorithm before users — nobody can; that's physics, not a gap. What we ship is a strong content-based cold-start that produces a personalized feed from the first tap, while logging every interaction so the learned algorithm trains itself the moment users arrive."* The onboarding picker + embeddings is a fully credible, demoable "the feed already adapts to me" story.

---

## 3) Pragmatic 3-phase path (1 dev, Supabase-native)

**Phase 1 — NOW (no data).** Content-based + onboarding prefs + popularity + diversity. **Log every interaction to a Supabase `events` table.** Replace static `data={PRODUCTS}` in `FeedScreen.tsx` with a `useRankedFeed()` hook calling a `rank_feed` RPC — this is the **seam** everything later plugs into. Capture dwell on each card.

**Phase 2 — SOME data (hundreds–thousands of interactions).** Item-item CF / co-occurrence in SQL ("liked-together"). Compute CLIP + sentence-transformer embeddings into a `pgvector` column; ANN "more like this" + a user-taste vector (mean of liked items). Session recency re-ranking. Blend CF + content + popularity in the RPC. `pg_cron` refreshes co-occurrence + popularity nightly.

**Phase 3 — SCALE (10k+ labeled interactions).** Train a **learned ranker on logged events**. Start with **gradient-boosted trees (LightGBM/XGBoost)** — features = candidate score components + user/item stats, label = dwell/like/save. Trains in seconds, beats hand-tuned weights immediately. Later graduate to a **two-tower neural retrieval** model; export item vectors to pgvector, keep GBT as the ranker. Train offline (Colab/Modal), serve via Edge Function. **Do not build neural nets before you have the data — Phases 1–2 generate exactly the training set Phase 3 needs.**

---

## 4) What to BUILD NOW so it can learn later

### 4a. Stable user identity (prerequisite)
Auth is fake and IDs are local-only. Mint a persistent **anonymous device id** now (UUID in AsyncStorage in `userStore`), send it as `user_id`. When real Supabase Auth lands, reconcile anon→real. **Without a stable id, no event you log is joinable into training data** — this is the one thing that, if skipped, makes all logging worthless.

### 4b. Interaction-events table (the asset that makes learning possible)

```sql
-- supabase/events-schema.sql  — run once in SQL Editor
create extension if not exists pgcrypto;

create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,                 -- anon device id now; real auth uid later
  session_id    text not null,                 -- one app-open / feed session
  product_id    text references public.products(id) on delete set null,
  event_type    text not null,                 -- see CHECK below
  dwell_ms      integer,                        -- GOLD: ms card was on full screen (impression/skip only)
  feed_position integer,                        -- 0-based rank where it was shown (de-bias by position)
  context       jsonb not null default '{}',    -- {surface:'home_feed', algo:'v1_content', source:'cf'|'content'|'explore', score:0.83}
  created_at    timestamptz not null default now(),
  constraint events_type_chk check (event_type in
    ('impression','skip','dwell','like','unlike','save','unsave',
     'add_to_fit','share','buy_click','product_open','search','onboarding_pick'))
);

create index if not exists events_user_time_idx on public.events (user_id, created_at desc);
create index if not exists events_product_idx    on public.events (product_id);
create index if not exists events_type_idx        on public.events (event_type);
create index if not exists events_session_idx     on public.events (session_id);

-- RLS: clients may INSERT their own events; no read (analytics via service role).
alter table public.events enable row level security;
create policy "events insert own" on public.events
  for insert to anon, authenticated with check (true);  -- tighten to user_id = auth.uid() post-auth
```

**Signals to capture (priority order):** `dwell_ms` on every card swipe-away (**#1, the gold signal**) → `buy_click` (revenue intent) → `save` / `add_to_fit` (strong positive) → `like` → `product_open` → `skip` (fast swipe = negative) → `share`, `search`, `onboarding_pick`. Always stamp `feed_position` (to de-bias: top cards get more attention regardless of quality) and `context.algo` (so you can A/B and offline-replay by algorithm version).

### 4c. Client logger + dwell capture
A tiny `track(event)` that batches inserts to `events` via REST (mirror `lib/supabase.ts`; buffer in AsyncStorage, flush on app background — never block the swipe). Dwell measurement lives in `FeedScreen.tsx`'s existing `onViewableItemsChanged`: timestamp when a card becomes the viewable item, and on the *next* `onViewableItemsChanged` emit `{event_type:'dwell', dwell_ms, product_id, feed_position}` for the one that left. You already have `currentIndex` and the viewability machinery — this is ~30 lines.

### 4d. How the app fetches a ranked feed (the seam)
Add `rank_feed` (Postgres RPC, Phase 1; promote to Edge Function in Phase 3). New `feedRankStore` / `useRankedFeed(userId)` returns ordered `product_id`s; `FeedScreen` renders `data={rankedProducts}` instead of raw `PRODUCTS`. **The component contract never changes across phases** — only what's behind the RPC does.

---

## 5) Concrete Supabase implementation

### 5a. pgvector + embeddings (Phase 2)
```sql
create extension if not exists vector;
alter table public.products
  add column if not exists img_embedding  vector(512),   -- CLIP ViT-B/32
  add column if not exists text_embedding vector(384);   -- all-MiniLM-L6-v2

-- IVFFlat ANN index (HNSW also fine); cosine distance
create index if not exists products_img_ann
  on public.products using ivfflat (img_embedding vector_cosine_ops) with (lists = 10);
```
**Where embeddings are computed:** with 226 items, **precompute in batch** — a one-off Node/Python script (sibling to your importer) calls a hosted embedding API (Replicate/HF Inference for CLIP, OpenAI/Cohere or local sentence-transformers for text), writes vectors with the service-role key. **Re-embed only new rows on import** (trigger an Edge Function on insert, or re-run nightly via `pg_cron`). Never embed on the client.

User taste vector = mean of `img_embedding` over the user's liked/saved/onboarding-picked items (computed in the RPC or cached on the user row).

### 5b. Phase-1 ranked-feed RPC (no ML, ships today)
```sql
create or replace function public.rank_feed(
  p_user_id   text,
  p_limit     int default 60,
  p_explore   float default 0.12  -- ε: fraction reserved for exploration
) returns table (product_id text, score float, source text)
language plpgsql stable as $$
declare
  fav_categories text[];
  fav_brands     text[];
  seen           text[];
begin
  -- Taste profile from this user's own events (onboarding picks + likes + saves)
  select array_agg(distinct pr.category)
    into fav_categories
  from public.events e join public.products pr on pr.id = e.product_id
  where e.user_id = p_user_id
    and e.event_type in ('like','save','add_to_fit','onboarding_pick','buy_click');

  select array_agg(distinct pr.brand)
    into fav_brands
  from public.events e join public.products pr on pr.id = e.product_id
  where e.user_id = p_user_id
    and e.event_type in ('like','save','add_to_fit','onboarding_pick','buy_click');

  -- Don't re-show items already acted on
  select array_agg(distinct e.product_id) into seen
  from public.events e
  where e.user_id = p_user_id
    and e.event_type in ('like','save','buy_click','skip');

  return query
  with scored as (
    select
      pr.id,
      -- content match (category + brand affinity), 0..1
      ( case when pr.category = any(coalesce(fav_categories,'{}')) then 0.6 else 0 end
        + case when pr.brand   = any(coalesce(fav_brands,'{}'))     then 0.4 else 0 end
      )                                                              as content,
      -- popularity prior, log-normalized 0..1
      ln(1 + greatest(pop.cnt,0)) / ln(1 + (select max(c) from
          (select count(*) c from public.events group by product_id) t)) as pop_norm,
      -- recency of catalog item 0..1 (favor fresh stock)
      exp(- extract(epoch from (now()-pr.updated_at))/ (7*86400))   as recency,
      pr.category
    from public.products pr
    left join (
      select product_id, count(*) cnt from public.events
      where event_type in ('like','save','buy_click','dwell') group by product_id
    ) pop on pop.product_id = pr.id
    where pr.in_stock = true
      and (seen is null or pr.id <> all(seen))
  ),
  ranked as (
    select id, category,
      -- ── PHASE-1 RANKING FORMULA ──
      (0.55 * content) + (0.25 * pop_norm) + (0.10 * recency)
        + (0.10 * random())                       -- exploration jitter (ε≈0.12 effective)
        as base_score
    from scored
  ),
  -- diversity: penalize repeats of the same category as we walk down the list
  diversified as (
    select id, category, base_score,
      base_score - 0.08 * (row_number() over (
        partition by category order by base_score desc) - 1) as final_score
    from ranked
  )
  select id, final_score,
         case when random() < p_explore then 'explore' else 'content' end
  from diversified
  order by final_score desc
  limit p_limit;
end; $$;

-- expose to anon/authenticated
grant execute on function public.rank_feed(text,int,float) to anon, authenticated;
```

### Phase-1 ranking formula (written out)

```
score(item, user) =
    0.55 · content_sim          // category + brand affinity vs taste profile  [0..1]
  + 0.25 · popularity_norm      // log-normalized interaction/like count        [0..1]
  + 0.10 · recency              // exp time-decay on catalog updated_at          [0..1]
  + 0.10 · exploration_jitter   // random() → ε-greedy long-tail surfacing       [0..1]
  − 0.08 · diversity_penalty    // × (#earlier items already shown in same category)
```
Tunable weights live in one place (the RPC, later a `ranker_weights` row) so the designer/you can A/B them. In **Phase 2**, replace `content_sim` with `1 − cosine_distance(item.img_embedding, user_taste_vector)` (pgvector `<=>`) and add a `cf_score` term from co-occurrence. In **Phase 3**, the GBT outputs the score directly and these terms become *features*.

### 5c. Phase-2 ANN "more like this" (drop-in)
```sql
select id, name, 1 - (img_embedding <=> (select img_embedding from products where id = $1)) as sim
from products where id <> $1 and in_stock
order by img_embedding <=> (select img_embedding from products where id = $1)
limit 20;
```

---

## 6) How to test a recommender BEFORE real users

**Offline replay (once events exist).** Hold out the last interactions per session; ask the ranker to predict; measure **NDCG@k / Recall@k / MAP** — did it rank the actually-liked/bought item high? This is how you compare formula weight sets and (Phase 3) models without shipping.

**Synthetic personas / simulated users (your pre-launch tool).** Define 6–10 personas as preference vectors (e.g. "sneakerhead, budget €150, loves Nike/New Balance", "minimal monochrome tees, low price"). Write a simulator that: pulls `rank_feed`, applies a **click/dwell model** (prob of dwell/like rises with cosine similarity between persona vector and item embedding, decays with feed position), and writes synthetic rows to `events`. This lets you **end-to-end exercise the full pipeline** (logging → RPC → feed) and verify "the feed bends toward the persona within N swipes" before any human touches it. It validates plumbing and the learning loop — not real human taste.

**A/B infra (build the hooks now, cheap).** `context.algo` already tags every event with the algorithm version. Bucket users by `hash(user_id) % 100` → assign `v1_baseline` (popularity-only) vs `v2_content`. Because the variant is on every event, analysis is one `group by context->>'algo'`. Wire this in Phase 1 so Phase 2/3 launches are measurable from day one.

**Metrics that matter (in priority for a swipe-feed):**
- **Mean dwell per card** + **completion/skip rate** — primary engagement (the gold signal, position-debiased).
- **Save-rate, add-to-FIT rate, like-rate** per impression — strong intent.
- **buy_click CTR** — the only one tied to revenue; watch closely (affiliate model).
- **D1 / D7 retention** — the north star; a good algorithm shows up here first.
- **Catalog coverage** (% of 226 shown) + **intra-list diversity** — guardrails against bubble/staleness; critical at small catalog size.
- **Session depth** (cards/session).

**Guardrails (block a launch if breached):** in-stock-only enforced; no >2–3 same-category in a row; min coverage floor (every item gets impressions weekly); exploration floor (ε ≥ ~0.1) so the tail isn't starved; latency budget on `rank_feed`.

**Closed beta validation.** 20–50 real testers (you, designer, marketing's network). Watch the live metrics dashboard, run the **v1 vs v2 A/B**, and confirm offline-replay NDCG improvements actually move D1/D7 + dwell. Only promote a ranker version after it wins on **both** offline (NDCG) and the small live A/B (dwell/retention) — synthetic + offline can mislead; the closed beta is the reality check before public launch.

---

## Bottom line for WEROL
The "TikTok algorithm" is **retrieval + ranking fed by implicit signals**, and it **cannot** exist before users — but a strong, demoable, content-based personalized feed can, and **everything you build in Phase 1 (stable user id, `events` table with dwell, the `rank_feed` seam) is precisely the dataset and plumbing that lets the learned algorithm train itself the day users arrive.** Build the logging and the seam first; the ML is the easy part later.

**Relevant files / artifacts:**
- Feed seam to refactor: `/Users/matus/werol-app/app/src/screens/FeedScreen.tsx` (replace `data={PRODUCTS}`), `/Users/matus/werol-app/app/src/store/feedStore.ts` (add `track()` + dwell), `/Users/matus/werol-app/app/src/store/userStore.ts` (mint anon `user_id`).
- Read path to mirror for writes/RPC: `/Users/matus/werol-app/app/src/lib/supabase.ts`.
- Heuristic to replace: `/Users/matus/werol-app/app/src/data/recommendations.ts`.
- New SQL to add next to existing schema: `/Users/matus/werol-app/supabase/events-schema.sql` and the `rank_feed` function (alongside `/Users/matus/werol-app/supabase/products-schema.sql`).

---

# 2. Data pipeline & data foundation

I now have full confirmation of every claim in the task. I have everything I need to write the analysis grounded in the actual code. Below is my report.

---

# WEROL — Data Pipeline & Data Foundation Audit

Senior data/backend review, grounded in the actual repo (`app/scripts/ingest-feed.mjs`, `supabase/products-schema.sql`, `app/src/lib/supabase.ts`, `app/src/store/{feedStore,userStore,productsStore}.ts`).

---

## 1) Confirmed: the catalog is STATIC — a one-time manual import

**Evidence in the repo:**
- `app/scripts/ingest-feed.mjs` is a `#!/usr/bin/env node` **dev harness** you run by hand (`node scripts/ingest-feed.mjs`). Its own header comment says the parse/map logic is *"later lifted into supabase/functions/ingest-feed (Deno) for the scheduled (pg_cron) import"* — i.e. that scheduled function **does not exist yet**. There is no `supabase/functions/` directory.
- `supabase/products-schema.sql` says *"Run once in the Supabase SQL Editor."*
- There is **no** `pg_cron` job, no Edge Function, no cron config anywhere in `supabase/`.

So: the 226 rows are a frozen snapshot from whenever you last ran the script locally with `SUPABASE_SERVICE_KEY` in your shell.

**Implications — spell them out for the team:**

| What goes stale | Consequence |
|---|---|
| **Prices** (`price_current`/`price_original`) | App shows last-import price. A user taps BUY, lands on the shop, sees a different (often higher) price → trust damage + bounce. Sale prices are the worst offender; they expire. |
| **Stock** (`in_stock`) | Worse: the importer at `mapItem` line 104 *hardcodes* `in_stock: true` (`delivery === null ? true : delivery !== '0' ? true : true` — always true). So **nothing is ever marked out of stock today**, even on import. Users click through to 404s / "sold out". |
| **New products** | Shop adds 50 SS26 drops → WEROL never sees them. Your "discovery" feed silently ages. |
| **Removed products** | Discontinued SKUs stay in the feed forever (the upsert at line 213 only ever inserts/updates — it never deletes). Dead links accumulate. |
| **Affiliate validity** | `buy_url` can rot (shop restructures URLs) → broken revenue path with no signal. |

**Bottom line:** for an affiliate-revenue app, a stale catalog directly burns money (broken BUY links pay €0) and trust. This is the #1 backend gap, ahead of the recommender — a great algorithm serving dead links is worthless.

One more data-quality note for the recommender work later: `app/src/lib/supabase.ts` `rowToProduct` *fabricates* the `likes` count via `stableLikes(id)` (a hash). That is fine as a UI placeholder but **must never be fed to a recommender as a popularity signal** — it is noise, not behavior.

---

## 2) Automating ingestion on Supabase

### Architecture

```
pg_cron (every 6–12h)
   └─ net.http_post → Edge Function `ingest-feed` (Deno)
         ├─ load shop_feeds rows (which feeds to pull)
         ├─ for each feed: fetch XML → parse → map → upsert (chunked)
         ├─ mark not-seen-this-run rows stale (soft delete)
         └─ write ingest_runs row (status, counts, error)  → monitoring
```

Keep the **exact parse/map functions** from `ingest-feed.mjs` (`mapItem`, `mapCustomProduct`, `mapCategory`, `dedupeVariants`, `parseFeed`). They are already correct and battle-tested on real feeds. Lift them verbatim into the Deno function — `fast-xml-parser` runs on Deno via `npm:fast-xml-parser`. **Do not rewrite the mapping logic**; just change the runner around it.

### Driver table (which feeds to ingest)

```sql
create table public.shop_feeds (
  id           uuid primary key default gen_random_uuid(),
  shop         text not null,                      -- display name + id prefix
  feed_url     text not null,
  format       text not null default 'heureka',    -- 'heureka' | 'custom'
  currency     text not null default 'EUR',
  buy_fallback text,                               -- {q} template for dropship feeds
  affiliate    jsonb not null default '{}',        -- { network, param, value } (see §4)
  enabled      boolean not null default true,
  refresh_hours int not null default 8,
  last_run_at  timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.shop_feeds enable row level security;
-- No anon/auth policies → only service role (Edge Function) reads/writes. RLS denies all else.
```

### Schema additions to `products` for multi-shop + staleness

```sql
alter table public.products
  add column if not exists feed_id     uuid references public.shop_feeds(id),
  add column if not exists status      text not null default 'active',  -- 'active'|'stale'|'oos'
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists content_hash text;   -- for incremental no-op skip

create index if not exists products_status_idx    on public.products (status);
create index if not exists products_last_seen_idx  on public.products (last_seen_at);
```

The app's read in `lib/supabase.ts` should add `&status=eq.active` to the PostgREST query so stale/OOS items disappear from the feed without being physically deleted.

### Idempotent upsert (already correct)
`ingest-feed.mjs` line 218–227 already does this right: `POST /rest/v1/products` with `Prefer: resolution=merge-duplicates`. The primary key `id = "<shopslug>:<ext_id>"` (line 89) is **stable and collision-free across shops** — re-running never duplicates. Keep `id` as the dedup anchor; set `feed_id` and `last_seen_at = now()` on every upserted row.

### Dedup across shops
`<shop>:<ext_id>` keys make *intra-shop* dedup trivial. The new problem at multi-shop scale is the **same physical product sold by 2 shops** (e.g. Nike Club Hoodie on Queens.sk *and* Footshop). Strategy:
1. **Don't physically merge** — affiliate economics differ per shop, and you want price competition. Keep both rows.
2. Add a **`product_group_key`** = normalized `coalesce(ean, lower(brand||'|'||name))`. Group in the *app/recommender layer* ("available at 2 shops, from €59"), not at ingest. This preserves per-shop buy URLs and lets you show the cheapest.

```sql
alter table public.products
  add column if not exists group_key text;
-- set during map: lower(brand||'|'||name) or ean when present
create index if not exists products_group_idx on public.products (group_key);
```

### Soft-delete / stale marking (full vs incremental)
This is the missing piece that fixes the §1 stock/removal problem. Two-phase per feed run:

```sql
-- 1) capture run start time, upsert all seen rows (sets last_seen_at = run_started)
-- 2) anything in THIS feed not touched this run = gone from the feed → stale:
update public.products
   set status = 'stale', updated_at = now()
 where feed_id = $1
   and last_seen_at < $run_started
   and status <> 'stale';
```

- **Incremental (every 6–12h):** fetch full feed (these XML feeds have no delta API), but use `content_hash` to skip writes for unchanged rows — only upsert changed/new, then run the stale sweep. Cheap.
- **Full refresh (weekly):** force-upsert all, ignore hash, useful after a mapping-rule change.
- Never hard-`DELETE`: soft-delete preserves referential integrity with `interaction_events`/`saved_items` (§5) and lets a product "come back" (`status='active'`) on restock without losing its history/embedding.

### Secrets in Vault
Today the service-role key lives in your **local shell env** (`SUPABASE_SERVICE_KEY`, line 17/27). That cannot move to a scheduled function as-is. Use **Supabase Vault**:

```sql
select vault.create_secret('eyJ...service_role...', 'service_role_key');
-- pg_cron reads it to authenticate the http_post to the Edge Function.
```
Inside the Edge Function, the service key is injected automatically as `SUPABASE_SERVICE_ROLE_KEY` (Edge runtime env) — you don't store it in code. Per-feed affiliate tokens go in `shop_feeds.affiliate` (not secret) or Vault if a network requires a secret API key.

### Edge Function shape (`supabase/functions/ingest-feed/index.ts`)

```ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { XMLParser } from 'npm:fast-xml-parser';
// import { parseFeed } from './map.ts'  ← lifted verbatim from ingest-feed.mjs

Deno.serve(async (req) => {
  // authn: only pg_cron with the cron secret may call this
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET'))
    return new Response('forbidden', { status: 403 });

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,   // bypasses RLS
  );

  const { data: feeds } = await sb.from('shop_feeds')
    .select('*').eq('enabled', true);

  for (const f of feeds ?? []) {
    const runStart = new Date().toISOString();
    try {
      const xml = await (await fetch(f.feed_url, {
        headers: { 'User-Agent': 'WEROL-ingest/1.0' }, signal: AbortSignal.timeout(60_000),
      })).text();

      const { mapped } = parseFeed(xml, f.shop /*, f.format, f.currency, f.buy_fallback */);
      const rows = mapped.map(r => ({ ...r, feed_id: f.id, last_seen_at: runStart, status: 'active' }));

      for (let i = 0; i < rows.length; i += 500)
        await sb.from('products').upsert(rows.slice(i, i + 500), { onConflict: 'id' });

      // stale sweep: not seen this run → gone from feed
      await sb.from('products').update({ status: 'stale' })
        .eq('feed_id', f.id).lt('last_seen_at', runStart).neq('status', 'stale');

      await sb.from('ingest_runs').insert({
        feed_id: f.id, status: 'ok', upserted: rows.length, started_at: runStart });
      await sb.from('shop_feeds').update({ last_run_at: runStart }).eq('id', f.id);
    } catch (e) {
      await sb.from('ingest_runs').insert({
        feed_id: f.id, status: 'error', error: String(e), started_at: runStart });
      // continue to next feed — one bad feed must not block the rest
    }
  }
  return new Response('ok');
});
```

> Note: a single Edge Function invocation is wall-clock bounded (~150–400s depending on plan). For many large feeds, have the function process **one feed per call** (pass `feed_id`) and schedule each feed separately, or fan out. With your current 1–3 feeds, the loop above is fine.

### Scheduling (pg_cron)

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('werol-ingest', '0 */8 * * *', $$
  select net.http_post(
    url     := 'https://hcrccagnnjeslnpmfdky.supabase.co/functions/v1/ingest-feed',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name='cron_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
$$);
```

### Monitoring + alerting

```sql
create table public.ingest_runs (
  id         bigint generated always as identity primary key,
  feed_id    uuid references public.shop_feeds(id),
  status     text not null,            -- 'ok'|'error'
  upserted   int default 0,
  marked_stale int default 0,
  error      text,
  started_at timestamptz not null,
  finished_at timestamptz default now()
);
```
- A second tiny cron job (hourly) checks: any `enabled` feed whose `last_run_at < now() - interval '24h'`, **or** an `ingest_runs` row with `status='error'` in the last 8h → fire an alert. Reuse your existing email path — you already have `supabase/send-welcome-email.sql` (Resend) wired, so send the dev a "feed X failed" email from that cron job. Also alert on **anomaly**: a successful run that upserts <50% of the prior count usually means a broken feed URL returning a stub page.

---

## 3) Images — hotlink vs cache to Storage/CDN

Today `lib/supabase.ts` line 64 hotlinks `image_url` straight from the shop (`{ uri: r.image_url }`), with a bundled local fallback.

| | Hotlink (current) | Cache to Supabase Storage + CDN |
|---|---|---|
| Effort | Zero | Ingest downloads + uploads each image |
| Reliability | Breaks when shop renames/expires URL, blocks hotlinking (Referer/hotlink protection), or has slow CDN | You own the bytes; survives shop URL rot |
| Performance | Mixed origins, no control, often non-optimized full-res JPEGs over a vertical full-screen feed | One CDN, can transform (resize/WebP) → much lighter on mobile data |
| Cost | €0 bandwidth | Storage + egress (small at your scale, see §6) |
| Legal/affiliate | Generally fine for affiliate (shops *want* their imagery shown) | Same |

**Recommendation (pragmatic, phased):**
- **Now:** keep hotlinking, but **validate at ingest** — HEAD the `image_url`; if non-200, fall back to `image_alt_url`, else null. Don't ship dead `<img>`s into a full-screen feed.
- **Soon:** cache to Supabase Storage during ingest, but **lazily** — only for products that actually get surfaced/liked (don't pay to cache all 226+ on day one). Store `storage_path`; the app prefers it, falls back to `image_url`. Serve via the Storage CDN with a render transform (`?width=1080&quality=75&format=webp`). This is the single biggest *perceived performance* win for a Reels-style feed.

---

## 4) Affiliate — where wrapping happens + click tracking

**Where to wrap: at ingest, NOT in the app.** The app's `takeItUrl`/`shop.url` (types/index.ts line 9/21) should already be the final affiliate deeplink. Reasons: the network/param differs per shop (driven by `shop_feeds.affiliate`), you keep affiliate logic out of the shipped client (can't be tampered with, can rotate tokens without an app release), and you can A/B wrap formats server-side.

Add to the map step (one place):
```ts
function wrapAffiliate(buyUrl: string, aff: {network:string,param:string,value:string,base?:string}) {
  if (aff.network === 'dognet')                       // deeplink-style
    return `${aff.base}?url=${encodeURIComponent(buyUrl)}&a_aid=${aff.value}`;
  const u = new URL(buyUrl);                           // param-style (utm/partner id)
  u.searchParams.set(aff.param, aff.value);
  return u.toString();
}
```
Store the wrapped result in `products.buy_url`. Keep the raw URL too:
```sql
alter table public.products add column if not exists buy_url_raw text;  -- pre-affiliate, for re-wrapping
```
So if you switch networks you re-wrap from `buy_url_raw` in a single migration, no re-fetch of feeds.

**Click tracking** — currently zero (the app just opens the URL). Two layers:
1. **Network side:** the affiliate network reports clicks/conversions per `subid`. Put your own subid in the wrap (e.g. `&subid=<user_id>:<product_id>`) so network reports tie back to WEROL users/products. **This is also a critical recommender signal** — a *click-to-buy* is a far stronger preference signal than a like.
2. **First-party side:** log the click yourself before redirecting (see `interaction_events` in §5, `event_type='buy_click'`). Don't rely solely on the network — you need clicks in your own DB to feed the algorithm and to measure feed→BUY conversion. Pattern: app calls a tiny `track-click` Edge Function (or inserts an event) → returns/opens `buy_url`. Optionally route through a `/r/:click_id` redirect Edge Function so you capture the click even if the insert is async.

---

## 5) The data model the app needs BEYOND products

**Why local-only must move server-side (the core argument for the team):**
Right now every preference signal lives in `feedStore` (`liked`, `saved`, `recentSearches`) and `userStore` (`savedOutfits`, `followedBrands`, `sizes`) inside **AsyncStorage on one device**. `buildRecommendations` (recommendations.ts) reads `liked`/`saved` arrays *in memory on the phone*.

Consequences while it stays local:
- **No recommender is possible.** An IG/TikTok algorithm trains on the *aggregate* behavior of *all* users. If signals never leave the device, the server has nothing to learn from — you can only ever do the per-device heuristic that exists today. **This is the single hard blocker on the user's core question.** The very first engineering step toward "an algorithm that learns" is: *land interactions in Postgres.*
- **No cross-device / no reinstall survival.** Reinstall the app → all likes/saves/outfits gone.
- **No social features.** `follows`, community FITS, "friends liked this" all require shared server state.
- **No measurement.** You can't compute CTR, save-rate, or feed→BUY conversion without server events.

So the migration is: **`feedStore.toggleLike/toggleSaved`, `addRecentSearch`, and `userStore.saveOutfit/toggleBrand` must dual-write** — keep the snappy local optimistic update (good UX) **and** fire an insert to Postgres. Keep local as a cache, make Postgres the source of truth.

This also requires **real auth** to replace the fake login (`userStore.login` just flips `isAuthenticated`). Without a real `auth.users` id, every event is anonymous and un-joinable. Supabase Auth is the prerequisite for all tables below.

### DDL

```sql
-- 5a. USERS — profile mirror of Supabase Auth. auth.users is managed by Supabase;
--      keep app-facing profile + preferences here, 1:1 by id.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  handle      text unique,
  display_name text,
  size_top    text, size_bottom text, size_shoes text,   -- from userStore.sizes
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self read"  on public.profiles for select using (auth.uid() = id);
create policy "profiles self write" on public.profiles for update using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
-- (Optional) public read of handle/display_name for social — split into a view if needed.

-- 5b. INTERACTION_EVENTS — append-only behavior log = the recommender's fuel.
create table public.interaction_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  event_type text not null,   -- 'impression'|'view'|'like'|'unlike'|'save'|'unsave'
                              --  |'add_to_fit'|'share'|'search'|'buy_click'
  weight     real not null default 1,           -- impression .1, like 1, save 3, buy_click 5…
  dwell_ms   int,                               -- how long the card was on screen (strong signal)
  context    jsonb default '{}',                -- {feed_pos, query, source:'feed'|'rec'}
  created_at timestamptz not null default now()
);
create index on public.interaction_events (user_id, created_at desc);
create index on public.interaction_events (product_id, event_type);
alter table public.interaction_events enable row level security;
-- Users insert/read ONLY their own events. Recommender (service role) reads all.
create policy "events self insert" on public.interaction_events
  for insert with check (auth.uid() = user_id);
create policy "events self read"   on public.interaction_events
  for select using (auth.uid() = user_id);

-- 5c. SAVED_ITEMS — replaces feedStore.saved (local). Likes can live here too
--      (event_type='like' in events) OR a dedicated saved_items for the "Saved" tab.
create table public.saved_items (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
alter table public.saved_items enable row level security;
create policy "saved self all" on public.saved_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5d. SAVED_OUTFITS — replaces userStore.savedOutfits + draftOutfit.
create table public.saved_outfits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  slots      jsonb not null,            -- { head, top, mid, bottom, feet } → product ids
  is_public  boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.saved_outfits enable row level security;
create policy "outfits owner all" on public.saved_outfits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "outfits public read" on public.saved_outfits
  for select using (is_public);     -- powers the community FITS feed (currently mock)

-- 5e. FOLLOWS — replaces userStore.followedBrands + future creator follows.
create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,         -- 'brand'|'shop'|'creator'|'user'
  target_id   text not null,
  created_at  timestamptz not null default now(),
  primary key (follower_id, target_type, target_id)
);
alter table public.follows enable row level security;
create policy "follows self write" on public.follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);
create policy "follows public read" on public.follows for select using (true);

-- 5f. PRODUCT_EMBEDDINGS — pgvector, content-based vectors for similarity + cold start.
create extension if not exists vector;
create table public.product_embeddings (
  product_id text primary key references public.products(id) on delete cascade,
  embedding  vector(1024),            -- match your embedding model's dim
  model      text not null,
  updated_at timestamptz not null default now()
);
create index on public.product_embeddings
  using hnsw (embedding vector_cosine_ops);
alter table public.product_embeddings enable row level security;
-- No anon policy: never expose raw vectors. Similarity is served via a SECURITY DEFINER
-- RPC that returns product_ids, so the client never reads the embedding column directly.
create policy "embeddings service only" on public.product_embeddings
  for select using (false);   -- service role bypasses; RPC runs as definer
```

**How these power the recommender (ties to the user's core question):**
- `interaction_events` = the training data (impressions vs likes vs buy_clicks, with dwell time and feed position).
- `product_embeddings` (pgvector) = **the answer to "can it be built before real users?": yes.** Content-based vectors are computed from product *attributes* (name, brand, category, description, image) — they need **zero user data**. So on day one you can already do "more like this" and seed the feed. As `interaction_events` accumulate, you layer collaborative signals on top (co-like/co-save → "users who liked X also liked Y"). That hybrid is the standard cold-start → warm-start path. *(Detailed algorithm design is the other workstream; this audit just guarantees the data foundation exists to support it.)*
- A nightly `pg_cron` job recomputes a per-user vector (weighted avg of interacted product embeddings) and the feed = `embedding <=> user_vector` ANN search via the HNSW index, filtered to `status='active'`.

---

## 6) Operational — cost, rate limits, reliability at small scale

**Cost (Supabase, pre-launch / low thousands of users):**
- Free tier covers this comfortably; **Pro ($25/mo)** is the realistic floor once you want daily backups, no project pause, and headroom. Everything proposed (pg_cron, pg_net, Edge Functions, pgvector, Storage) is included — no separate infra, matching your stack constraint.
- **Edge Function invocations:** ingest every 8h = 90/mo. Click tracking + interaction writes scale with usage but are tiny (free tier = 500K invocations/mo).
- **Database:** 226 products, even 50K, is megabytes. `interaction_events` is the only table that grows fast — at, say, 1K daily users × 200 events = 200K rows/day. Add a **retention policy** (cron: delete raw `impression` events >90 days; keep aggregated signals) to cap storage.
- **pgvector:** 1024-dim × 50K products ≈ 200MB, fine in Postgres. Embedding *generation* cost is external (your embedding model) and one-time per product at ingest.
- **Storage/CDN (if you cache images, §3):** 50K images × ~150KB WebP ≈ 7.5GB stored; CDN egress is the variable cost — lazy-caching only surfaced products keeps this small. Free tier = 1GB storage / 2GB egress; Pro = 100GB storage / 250GB egress.

**Rate limits / politeness on the *outbound* side:**
- Fetching shop feeds: set a real `User-Agent` (already done, line 299), a **60s timeout** (`AbortSignal.timeout`), and **don't hammer** — every 8–12h is courteous and sufficient (these catalogs don't change minute-to-minute). Stagger feeds if you add many.
- PostgREST writes: keep the 500-row chunking (already in `upsert`). Supabase has connection limits — chunked sequential upserts via PostgREST (not raw connections) is the safe pattern.

**Feed scheduling reliability:**
- pg_cron is in-database and survives restarts, but a job that errors mid-run leaves no signal unless you log it — hence `ingest_runs` (§2) is mandatory, not optional.
- Make the function **resilient per-feed**: one feed 500ing must not abort the others (the `try/catch` inside the loop does this).
- Watch the **single-invocation wall-clock limit**: if total feed processing approaches the limit, switch to **one feed per invocation** (cron passes `feed_id`, or fan out N scheduled jobs). With 1–3 feeds today you're fine; design for it before onboarding 20 shops.
- **Idempotency = your safety net:** because upserts key on the stable `<shop>:<ext_id>` id, a retried or double-fired cron run is harmless. Keep it that way.

---

## Priority order for the 1-dev team

1. **Automate ingestion + fix the always-`true` stock bug + stale sweep** (§1/§2) — stops burning affiliate revenue and trust. Highest ROI, ~1–2 days lifting existing code into an Edge Function + cron.
2. **Real Supabase Auth + dual-write interactions to `interaction_events`/`saved_items`** (§5) — the non-negotiable prerequisite for *any* learning algorithm. Without it the core product vision is impossible.
3. **`product_embeddings` (pgvector) computed at ingest** (§5f) — unlocks content-based recommendations *before* users exist, directly answering the founder's question.
4. **Affiliate wrap at ingest + buy_click tracking** (§4) — measurable revenue + the strongest preference signal.
5. **Image caching to CDN** (§3) — perceived performance polish, do lazily.

Relevant files reviewed: `/Users/matus/werol-app/app/scripts/ingest-feed.mjs`, `/Users/matus/werol-app/supabase/products-schema.sql`, `/Users/matus/werol-app/app/src/lib/supabase.ts`, `/Users/matus/werol-app/app/src/store/feedStore.ts`, `/Users/matus/werol-app/app/src/store/userStore.ts`, `/Users/matus/werol-app/app/src/store/productsStore.ts`, `/Users/matus/werol-app/app/src/data/recommendations.ts`, `/Users/matus/werol-app/app/src/types/index.ts`.

**Two concrete bugs found in the current code:**
- `ingest-feed.mjs:104` — `in_stock` is hardcoded to `true` in all branches, so out-of-stock is never recorded even at import time.
- `lib/supabase.ts:46` (`stableLikes`) — `likes` is a hash-fabricated number; it must not be used as a popularity signal for the recommender.

---

# 3. Feature gap analysis

I have full grounding on the current state. The code confirms: fake auth (`login` just flips a local bool), all interactions local-only via zustand+AsyncStorage, static feed (FlatList over a fixed array, no refetch/pagination), mock messages with a random pool, heuristic recommender over the local catalog. Here is the gap analysis.

---

# WEROL — Launch-Readiness Gap Analysis

**Verdict:** You have a polished prototype on real product data, but the single most important thing — the algorithm — **cannot exist yet**, because there is zero server-side record of user behavior. `feedStore` (likes/saves), `outfitFeedStore`, and `userStore` all persist only to AsyncStorage. The recommender reads `liked`/`saved` from local state. **Until interactions hit the DB, no algorithm (heuristic or ML) can learn, personalize, or even be measured.** Everything below is ordered to unblock that as fast as possible.

## The recommender question, answered directly

**Can you build the algorithm before real users? Yes — but in stages, and the data plumbing must come first.**

- **You cannot meaningfully train collaborative filtering with 0 users** (CF learns "people like you also liked X" — needs many users). So the *launch* algorithm is **content-based + heuristic**, not ML. That is exactly how IG/TikTok solve cold-start too: they don't start with ML, they start with onboarding-seeded interests + content features + popularity, then layer ML once interaction volume justifies it.
- **How it's actually done (the realistic path for you):**
  1. **Cold-start / onboarding:** ask 5–8 taste questions (categories, brands, styles, price band) → seed an interest vector per user.
  2. **Content-based ranking:** embed each product (category, brand, shop, price, and ideally a `pgvector` embedding of title+image). Rank feed by similarity to the user's interest vector + recency + popularity. This is buildable **before** real users using your 226 products + synthetic taste profiles.
  3. **Online learning from events:** every swipe/like/save/dwell/BUY is an event row in Postgres. A scheduled job (`pg_cron`/Edge Function) recomputes each user's interest vector from recent events (decayed by time). This is the "it learns you" loop.
  4. **Collaborative / ML later:** once you have thousands of users × events, add item-item CF or a learned ranker. Not a launch concern.
- **How to test it before real users:** (a) **synthetic users** — script N fake taste profiles, simulate sessions against your ranker, assert the feed shifts toward seeded interests; (b) **offline replay** — once you have any real events, hold out the last interaction and measure recall@k / "did the model rank the held-out liked item highly"; (c) **internal dogfood** — the 3 of you use it for 2 weeks and eyeball relevance; (d) **A/B harness** — ship a `feed_variant` flag so you can compare ranked vs. chronological once users exist.

**The non-negotiable prerequisite for all of this: an `events` table that every interaction writes to.** That is P0 #2 below and the spine of the whole roadmap.

---

## Is the feed static or live?

**Static.** `FeedScreen` renders a `FlatList` over a fixed `useProducts()` array. `productsStore.hydrate()` fetches the 226 rows **once** and never refetches; there is no pull-to-refresh, no pagination, no re-ranking, and the order is `updated_at.desc` (catalog order, not per-user). The "feed" is currently a static product list in import order, identical for everyone. Making it *live and personalized* is the core build.

---

## Prioritized gap list

Effort for 1 dev: **S** ≈ ≤1 day · **M** ≈ 2–5 days · **L** ≈ 1–2+ weeks.

### P0 — Blocks real-user launch (and/or blocks the recommender)

| # | Gap | What it is | Why it matters (recommender tie) | Effort | Depends on |
|---|-----|-----------|----------------------------------|--------|-----------|
| 1 | **Real auth (Supabase Auth)** | `login()` just sets `isAuthenticated=true`; any email works (`SignInScreen` → `userStore.login`). | **The keystone.** Every event needs a stable `user_id`. No real auth → no per-user data → no recommender, no cross-device, no analytics. Also: App Store rejects fake/insecure auth flows. | M | — |
| 2 | **Event ingestion (`events` table + write path)** | A Postgres `events` table (`user_id, type, product_id, ts, context, dwell_ms`) + an `ingestEvent()` client helper called wherever `feedStore`/`outfitFeedStore` mutate. Capture: impression, dwell, like, save, add-to-FIT, share, BUY-click, search. | **This is the algorithm's fuel.** Currently 100% local → server has zero behavioral signal. Nothing downstream (ranking, learning, analytics, dedupe) works until interactions hit the DB. Build this *with* RLS so users only write their own rows. | M | #1 |
| 3 | **Sync local interactions → DB (dual-write)** | Make `toggleLike/toggleSaved/addRecentSearch/saveOutfit` write to Supabase (keep AsyncStorage as cache/offline buffer). On login, hydrate `liked/saved` from server. | Enables cross-device, server-side recommender input, and prevents data loss on reinstall. Without it the recommender keeps reading only local state. | M | #1, #2 |
| 4 | **Onboarding / taste seeding** | 5–8 question flow after signup → write an `interest_profile` row (categories, brands, price band, style). | **Solves cold-start.** A brand-new user with 0 events still gets a non-random first feed. This is *the* prerequisite for the feed feeling "smart" on day one. Doubles as a conversion/retention surface. | M | #1, #2 |
| 5 | **Personalized feed endpoint (v1 ranker)** | Replace the static array with a `get_feed(user_id, cursor)` RPC/Edge Function: ranks catalog by interest-vector match + popularity + recency, paginated, excludes already-seen. Wire `FeedScreen` to it. | This *is* the product's core value. Even a heuristic version (content-based, no ML) makes the feed live + personalized + infinite. Start heuristic; swap internals for `pgvector`/ML later without changing the client contract. | L | #1, #2, #4 |
| 6 | **In-app account deletion** | A "Delete account" path in `ProfileScreen` that deletes the auth user + their rows (Edge Function w/ service role). | **Hard App Store / Google Play requirement** (guideline 5.1.1(v)) — *automatic rejection* without it. Also GDPR (you're EU/SK). | S | #1 |
| 7 | **Loading / empty / error / offline states** | Most screens assume data is present (feed, Saved, Search, Profile). `productsStore` silently falls back to mock on error. | App-review reviewers test on bad networks; a blank/crashing screen = rejection. Also: once feed/Saved are server-backed, "no data yet" and "offline" are real states you must render. | M | #5 (feed), #3 (saved) |
| 8 | **Privacy policy + consent + store metadata** | Hosted privacy policy URL, data-collection disclosures (App Store Privacy "Nutrition Label" / Play Data Safety), age rating, ATT prompt if you add affiliate/ad tracking. | Required to submit. You're now collecting behavioral data (events) → you *must* disclose it. ATT needed before any cross-app affiliate attribution. | S | #2 |

### P1 — Soon after launch

| # | Gap | What it is | Why it matters | Effort | Depends on |
|---|-----|-----------|----------------|--------|-----------|
| 9 | **Affiliate click tracking** | `BuyRedirectSheet`/`TakeItButton` log a `buy_click` event + route through tracked affiliate URLs (network/deeplink params) before opening the shop. | **This is your revenue.** Untracked = unattributed = unpaid. Also a strong relevance signal for the ranker (intent > like). | M | #2 |
| 10 | **Real push (expo-notifications + EAS)** | Replace `messagesStore`'s random `LIVE_MESSAGE_POOL` + fake timer. Register device tokens, send via Expo Push from an Edge Function (price drops, drops from followed brands, "new for you"). | Retention driver and a re-engagement loop feeding the recommender (notification → session → events). Current "live messages" are fake. | M | #1, #2 |
| 11 | **Online interest-vector recompute** | `pg_cron`/Edge Function that nightly (or on-event) rebuilds each user's interest vector from recent decayed events. | Turns the static onboarding seed into a *learning* feed — "it gets to know you." This is the step that makes it feel like TikTok. | M | #2, #5 |
| 12 | **Live catalog refresh (cron import)** | Promote the one-time manual XML import into a scheduled Edge Function / `pg_cron` job; track price/stock deltas. | Stale stock/prices → broken BUY links → lost revenue + bad UX. Price-drop deltas also power push (#10). | M | — |
| 13 | **Server-side analytics / funnel** | Dashboards on the `events` table (DAU, swipe-through, like rate, BUY CTR, retention). | You can't improve the algorithm or the funnel without measurement. The `events` table gives this for free once it exists. | S | #2 |
| 14 | **Feed pull-to-refresh + re-rank on return** | Let users refresh; re-rank when they re-open after N hours. | Makes "live" tangible; cheap once #5 exists. | S | #5 |
| 15 | **A/B / feed-variant flag** | A `feed_variant` per user + event tagging. | Lets you prove ranked-vs-chronological lift and tune safely. | S | #2, #5 |

### P2 — Later

| # | Gap | What it is | Why it matters | Effort | Depends on |
|---|-----|-----------|----------------|--------|-----------|
| 16 | **FITS community = real (replace mock)** | `outfits.ts` is static mock; `outfitFeedStore` is local. Back outfits with a DB table + real authorship. | Community/UGC is a moat and a content engine, but premature with 0 users. | L | #1, #2, #17 |
| 17 | **User image upload (post own FITs)** | Supabase Storage + upload UI; no upload exists today. | Required for real UGC; also moderation burden — defer until you have users. | M | #1, #16 |
| 18 | **pgvector embeddings + ML ranker** | Embed product title/image; later a learned/CF ranker over accumulated events. | The "real" ML algorithm. **Only worth it after meaningful event volume** — heuristic (#5) is enough for launch and early users. | L | #5, #11, data volume |
| 19 | **Moderation / reporting / blocking** | Report content/users, block, takedown. | Required *once* UGC exists (#16/#17) — also a store requirement for social apps. | M | #16 |
| 20 | **Real orders/sizes/brands backing** | `ProfileScreen` orders/sizes/followed-brands are mock/local. | Nice-to-have; followed-brands is actually a useful recommender signal — wire it into events when convenient. | M | #1, #2 |

---

## Sequenced build order (ruthless — recommender unblocked ASAP)

The whole game is: **get a stable `user_id`, get events into Postgres, then rank.** Everything else waits.

**Phase 0 — Data spine (unblocks the recommender). ~1.5–2 wks**
1. **#1 Supabase Auth** — stable `user_id`. Nothing works without it.
2. **#2 `events` table + `ingestEvent()` + RLS** — in parallel with #1's tail. Wire it into *every* `feedStore`/`outfitFeedStore`/search mutation. **The moment this ships, you are recording behavior and can start measuring.**
3. **#3 Dual-write + server hydrate of likes/saves** — interactions now persist server-side and cross-device.

**Phase 1 — Make the feed live & personalized. ~2 wks**
4. **#4 Onboarding taste seeding** — solves cold-start; required before personalization feels real.
5. **#5 Personalized feed RPC (heuristic/content-based, paginated)** — swap the static `FlatList` array for `get_feed(user_id, cursor)`. **This is launch of the actual product value.** Keep it heuristic; do *not* block on ML.
6. **#7 Loading/empty/error/offline states** — now mandatory because the feed is network-backed.

**Phase 2 — Store-submittable. ~1 wk**
7. **#6 Account deletion** + **#8 privacy policy/consent/store metadata** — clears the two hard rejection reasons. **You can submit here.**

**Phase 3 — Revenue + learning loop (right after launch). ~2 wks**
8. **#9 Affiliate tracking** — turn on the money + intent signal.
9. **#11 Online interest-vector recompute (`pg_cron`)** — the feed now *learns*. **This is the "TikTok algorithm" milestone** — and it's only ~M effort because the spine (#2) already exists.
10. **#13 analytics**, **#10 push**, **#12 cron catalog refresh**, **#14/#15 refresh + A/B**.

**Phase 4 — Scale & community (later).** #16–#20: real FITS/UGC, moderation, and pgvector/ML ranker once event volume justifies it.

### Why this order
- **#1 → #2 → #3 is the only path to the recommender.** Doing onboarding (#4) or a fancy ranker (#18) before events exist is wasted work — there's nothing to learn from and nothing to measure against.
- **Heuristic ranker (#5) ships at launch; ML (#18) is deferred.** With 226 products and 0 users, content-based + onboarding seed *is* the correct algorithm. CF/ML needs data you won't have until after launch.
- **The "it learns you" feeling is #11, not #18** — and #11 is cheap *because* #2 laid the spine. You get 80% of the TikTok-feel for ~M effort, long before any ML.
- **Account deletion + privacy (#6/#8) are gating for submission** but trivial — don't let them slip, but don't do them first.

### Test plan for the recommender (do alongside Phases 1–3)
- **Before users:** seed ~50 synthetic taste profiles, simulate sessions against `get_feed`, assert returned items skew toward seeded categories/brands and that seen items don't repeat.
- **After #2 ships:** offline replay — hold out each user's last like, measure recall@k that the ranker surfaces it.
- **Internal dogfood:** 3-person team uses it 2 weeks; track like-rate and BUY-CTR via #13.
- **A/B (#15):** ranked vs chronological once you have ~hundreds of users; ship the winner.

**Relevant files:** `/Users/matus/werol-app/app/src/store/feedStore.ts` and `/Users/matus/werol-app/app/src/store/outfitFeedStore.ts` (interaction mutations — the dual-write hook points for #2/#3); `/Users/matus/werol-app/app/src/store/userStore.ts` and `/Users/matus/werol-app/app/src/screens/auth/SignInScreen.tsx` (fake auth to replace, #1); `/Users/matus/werol-app/app/src/lib/supabase.ts` (anon REST client — extend with auth + event writes); `/Users/matus/werol-app/app/src/store/productsStore.ts` and `/Users/matus/werol-app/app/src/screens/FeedScreen.tsx` (static feed to make live/personalized, #5); `/Users/matus/werol-app/app/src/data/recommendations.ts` (current heuristic — becomes the server ranker's v1 logic); `/Users/matus/werol-app/app/src/store/messagesStore.ts` (fake notifications/timer to replace, #10); `/Users/matus/werol-app/app/src/data/outfits.ts` (mock FITS, #16); `/Users/matus/werol-app/app/src/screens/ProfileScreen.tsx` (needs account-deletion path, #6).

---

# 4. UX & growth

I now have a thorough picture of the codebase. Confirmed key facts: no `expo-haptics` / `expo-image` installed, plain RN `Image` with blur-backdrop hack, no onboarding taste-capture (registration goes straight to a fake account with hardcoded `followedBrands: ['Nike', 'Carhartt WIP', 'Stüssy']` and sizes), local-only `liked`/`saved` arrays, no swipe-away/dislike signal captured, no scroll-dwell tracking, fake `watching` counts, `buildRecommendations` is a static bucket builder not even wired into the feed (feed renders the flat catalog in `updated_at.desc` order). I have enough to write the analysis.

# WEROL — UX, Retention & Growth Audit

Grounded in the actual code. Key gaps confirmed: feed renders the flat catalog (`order=updated_at.desc`) — `buildRecommendations` exists but **never touches the feed**; no `expo-haptics` / `expo-image` installed; plain `<Image>` + blur-backdrop hack; only signals captured are `liked`/`saved` (binary, local-only); no swipe-away / dwell / dislike; `watching` counts are fake; onboarding skips taste entirely and hardcodes `followedBrands: ['Nike','Carhartt WIP','Stüssy']`.

---

## (a) Feed quality + surfacing "it learns me"

The #1 product gap is that **the feed is not the recommender**. `FeedScreen` maps the raw catalog into a `FlatList`; the heuristic in `recommendations.ts` only powers side buckets. Personalization is invisible.

- **Wire the recommender into the feed itself**, not a "For You" shelf. Re-rank the catalog client-side on mount/refresh by liked/saved category+shop+brand affinity, interleaved with exploration (~70% exploit / 30% explore so it doesn't collapse). This alone makes the main surface feel alive with zero backend.
- **Capture the signals you're throwing away.** A vertical Reels feed's richest signal isn't likes — it's *dwell time* and *swipe-away speed*. You already have `onViewableItemsChanged` + `currentIndex`. Add per-card dwell (timestamp on enter/exit) and a fast-skip flag. Store as negative signal. Binary like/save is far too sparse to "learn" anyone.
- **Add an explicit dislike/"not for me"** (long-press or left-swipe). The strongest, cleanest preference signal and currently absent.
- **Surface the learning explicitly.** TikTok feels smart because it *names* the inference: "Because you saved 3 Carhartt pieces", "More cargo fits like the ones you liked". Add a one-line "why am I seeing this" reason chip on cards once affinity exists. Perceived personalization > actual personalization at this stage.
- **Refresh affordance:** pull-to-refresh that visibly reshuffles ("Tuned to your taste · 12 new") so the user sees cause→effect.

## (b) Image performance

Current `ProductCard` is expensive: it renders the **same image twice** (foreground + stretched blurred backdrop) plus an `expo-blur` `BlurView` over it, and runs an infinite `withRepeat` pulse animation **per card** — heavy on a paging feed.

**Quick wins**
- Install **`expo-image`**; replace both `<Image>`s. Get disk/memory caching, `contentFit`, `transition` fade-in, and **blurhash/thumbhash placeholders** for free.
- **Generate a blurhash at import time** (the importer already parses the XML; add a `blurhash` column). Use it as the card placeholder → instant perceived load, kills the white flash. This also lets you **drop the double-image blur-backdrop hack** entirely (use the blurhash as the backdrop), removing one full-screen image decode + the `BlurView` per card.
- **Prefetch the next 2–3 cards.** In `onViewableItemsChanged`, call `Image.prefetch()` on upcoming URLs. Critical for a swipe feed to feel instant.
- Pass **width-optimized image URLs** if the CDN/Supabase Storage supports transforms — you're loading full-res into a phone viewport.

**Bigger bet**: server-side responsive variants + a thumbhash on every product row in the import pipeline.

## (c) Loading / empty / error / offline states

`SavedScreen` has good empty states; the **feed has none**. `productsStore` silently falls back to mock on error — user can't tell live data failed, and there's no loading or offline indicator.

**Quick wins**
- Feed **skeleton cards** (shimmering placeholders) while `status === 'loading'`.
- **Offline banner** + retry when `hydrate()` catches (currently swallowed). Add `@react-native-community/netinfo` to detect connectivity and auto-retry on reconnect.
- **Error state** distinct from empty ("Couldn't load — Retry") instead of silently showing mock as if real.
- End-of-feed state ("You're all caught up — refresh for new drops") instead of a hard stop at 226.

## (d) Onboarding that captures taste (cold-start seed)

**Biggest miss.** `register()` jumps straight to the feed and hardcodes brands/sizes. You're discarding the single best cold-start opportunity.

Add a **3-screen post-signup flow** (skippable but defaulted-in):
1. **Style pick** — tap 5+ aesthetic tiles (streetwear / techwear / minimal / Y2K / workwear…). Visual, fast.
2. **Brand pick** — multi-select from your real catalog's brands (you already aggregate brands in `SavedScreen`).
3. **Sizes** — top / bottom / shoe (already in `userStore.sizes`; just surface it). Powers fit filtering + restock alerts later.

This **seeds `buildRecommendations` from turn one** — the feed is personalized before the first swipe, which is exactly how you make a recommender work pre-users. A **"rapid-fire" tinder round** (swipe yes/no on 10 products) is an even richer seed and doubles as a delightful first session. Write these to a `user_taste` table so the seed isn't local-only.

## (e) Micro-interactions + haptics

**`expo-haptics` is not installed.** A TikTok-style app with zero haptics feels dead.

**Quick wins** (1–2 hrs)
- `Haptics.impactAsync(Light)` on like/save/FIT-add; `Medium` on BUY.
- **Double-tap-to-like on the image** (Instagram's signature) with a burst heart animation — you already have Reanimated.
- Heart **scale/bounce** on like (you have the `fitFlash` pattern — reuse it).
- Snap haptic on each card settle (`onMomentumScrollEnd`).
- The infinite per-card `pulse` animation should pause for off-screen cards (perf + battery).

## (f) Retention loops

`messagesStore` is mock with a fake 15s timer; **no real push** (`PushNotification` tool / `expo-notifications` not wired). Notifications are *the* retention engine for commerce discovery.

**Quick wins**
- **`expo-notifications`** + capture push token at onboarding.
- **Price-drop alerts on saved items** — highest-converting commerce notification, and you already store `saved` + have `price.original`. A `pg_cron` job comparing last-known price to current on re-import → push. Native to your Supabase stack.
- **Daily Drop ritual** — one curated push at a fixed time ("Today's 10 drops"). Creates an appointment habit; the import already gives you a fresh-products notion via `updated_at`.

**Bigger bets**
- **Restock alerts** (you have `in_stock` in the row type — diff it on import).
- **Streaks** ("3-day discovery streak") + collection/completion mechanics.
- **Follow loop**: follow brands/creators → "New from Nike" pushes. `followedBrands` exists but does nothing yet.

## (g) Social proof + FITS community loop

`watching` counts are **fabricated** (`stableLikes` hash) — risky and hollow. FITS is mock; FIT builder writes only to local `savedOutfits`.

**Quick wins**
- Replace fake "WATCHING" with **honest proof**: "saved by you", "in 4 FITs", real save counts once interactions sync. Fake live counts erode trust fast with real users.
- Make **FIT shareable** (you have `StoryShareSheet`) — outfit collages are inherently viral and your best organic-acquisition asset.

**Bigger bet**
- Real FITS feed: users post outfits → others shop the exact pieces ("shop this look"). This is the defensible loop (UGC + affiliate) and the reason to open accounts/social. Needs interaction sync to Supabase first.

## (h) Conversion

`BuyRedirectSheet` opens the shop URL but **deeplink/affiliate tracking isn't wired** — you can't attribute revenue.

**Quick wins**
- **Append affiliate params** to `buy_url` (per-shop) at the redirect, and log an `outbound_click` event (product, shop, user, ts) to Supabase. Without this you have no revenue attribution and no conversion signal to feed back into ranking.
- **Wishlist = price-drop opt-in.** Reframe Save as "Watch price" with a notify toggle — turns a passive bookmark into a re-engagement hook.
- Show **discount math** on cards (`-23%` badge when `original` exists) — you have the data, it drives urgency.

**Bigger bet**: post-purchase confirmation loop (hard without true deeplinks) for order tracking + sizing feedback.

## (i) Accessibility + dark-mode polish

- `SavedScreen` uses theme tokens via `useColors`; **`ProductCard` / `FeedScreen` hardcode `WEROL_TOKENS`** — inconsistent theming, dark-only by assumption. Decide if light mode is in scope; if not, make that explicit and drop the unused `useColors` paths.
- **Accessibility is absent**: side-action `Pressable`s have no `accessibilityLabel`/`accessibilityRole`; 8–9px mono labels fail contrast/size guidelines. Add labels, bump min hit targets (icons are 40px ✓ but labels aren't tappable), respect `prefers-reduced-motion` for the pulse/animations.
- Text over photos needs guaranteed contrast — the gradient helps but isn't guaranteed on light product shots; add a min scrim.

## (j) What TikTok/IG have that WEROL lacks

1. **A feed that visibly adapts within a session** — the core magic; today it's a static list.
2. **Negative signal capture** (swipe-away, not-interested) — they learn from skips, not just likes.
3. **Haptic + double-tap-like tactility** — completely missing.
4. **An appointment/notification habit loop** — no real push.
5. **Bottomless feed with infinite freshness** — you cap at 226 static, manually-imported products; no auto-refresh cron.
6. **Creator/UGC supply** — their content is endless and free; your FITS loop is the equivalent but still mock.

---

## Priority cheat sheet

### QUICK WINS (high impact / low effort)
1. **Wire `buildRecommendations` into the actual feed** + interleave explore — make the main surface personalized.
2. **Capture dwell time + swipe-away + add a dislike** — the signals a recommender actually needs.
3. **`expo-haptics`** on like/save/buy + **double-tap-to-like** with heart burst.
4. **`expo-image` + blurhash placeholder + prefetch next 2–3** — kill the double-image/BlurView hack; instant feel.
5. **Taste-capture onboarding** (style tiles + brands + sizes) → seeds the recommender pre-users.
6. **Feed loading/offline/error/end states** (currently none).
7. **`-%` discount badges** + reframe Save as "Watch price".
8. **Affiliate params + outbound-click logging** — get revenue attribution.
9. **Replace fake "WATCHING" counts** with honest proof.

### BIGGER BETS
1. **Sync interactions to Supabase** (events table) — prerequisite for real ranking, social proof, and price-drop pushes.
2. **`expo-notifications` + `pg_cron` price-drop / restock / daily-drop pushes** — the retention engine.
3. **Real FITS community loop** (post → shop-this-look) — the defensible UGC + affiliate moat.
4. **Auto-refreshing catalog** (Edge Function + `pg_cron` re-import) so the feed is bottomless/fresh.
5. **pgvector-based recommendations** once interaction volume exists (image/text embeddings → similarity) — the "real algorithm".

**Sequencing note:** for the user's core question — yes, a learning feed can ship *before* real users. The pre-user version is **onboarding seed + heuristic re-rank + dwell/skip capture**, all client-side on your existing data. Test it with a held-out simulation (seed N synthetic taste profiles, verify the feed reorders sensibly) and a small manual beta where you watch whether saves cluster into the inferred categories. The ML/pgvector version only earns its complexity *after* you're logging interactions server-side — which is why "sync interactions to Supabase" is the gating bigger bet.

Relevant files: `/Users/matus/werol-app/app/src/screens/FeedScreen.tsx`, `/Users/matus/werol-app/app/src/components/ProductCard.tsx`, `/Users/matus/werol-app/app/src/store/feedStore.ts`, `/Users/matus/werol-app/app/src/store/productsStore.ts`, `/Users/matus/werol-app/app/src/data/recommendations.ts`, `/Users/matus/werol-app/app/src/store/userStore.ts`, `/Users/matus/werol-app/app/src/screens/auth/SignUpScreen.tsx`, `/Users/matus/werol-app/app/src/store/messagesStore.ts`, `/Users/matus/werol-app/app/src/lib/supabase.ts`.
