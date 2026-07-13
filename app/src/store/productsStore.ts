// Products store — single source of truth for the catalog.
// Seeds with the local mock so the app always renders; hydrate() pulls real
// rows from Supabase and replaces the array (keeps mock on empty/error).
//
// FEED FILTER: the magnifier on HOME opens a filter (query / categories /
// brands). `feedProducts` is the filtered view the FEED renders; the full
// catalog (`products`) stays untouched for CREATE, search helpers, etc.
// IMPORTANT (product rule): while a filter is active, user interactions must
// NOT feed the recommendation algorithm — check `filter !== null` (Phase 6).

import { create } from 'zustand';
import type { CategoryId } from '../data/categories';
import { PRODUCTS as MOCK_PRODUCTS } from '../data/products';
import { productMatchesQuery } from '../lib/productSearch';
import { fetchProducts } from '../lib/supabase';
import type { Product } from '../types';

export type FeedFilter = {
  query: string;
  categories: CategoryId[];
  brands: string[];
  styles: string[];
};

/** Fisher–Yates shuffle (copy) so shops/categories interleave in the feed
 * instead of arriving grouped by import batch. Fresh order each launch. */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Feed ranking v1 — personal score from engagement aggregates (likes, saves,
 * shares, click-throughs, dwell; see engagementStore) + a healthy random
 * jitter for exploration. With no signals yet it degrades to a pure shuffle.
 * Re-ranks on every hydrate (app launch + Home re-tap refresh).
 */
function rankForUser(products: Product[]): Product[] {
  // lazy require to avoid a module-init import cycle with engagementStore
  const { getEngagement } = require('./engagementStore') as typeof import('./engagementStore');
  const { styleTags } = require('../lib/productStyle') as typeof import('../lib/productStyle');
  const { categoryScores, brandScores, styleScores } = getEngagement();
  const hasSignals =
    Object.keys(categoryScores).length > 0 ||
    Object.keys(brandScores).length > 0 ||
    Object.keys(styleScores).length > 0;
  if (!hasSignals) return shuffle(products);

  // Normalize each signal to a bounded 0..1 AFFINITY relative to its strongest
  // value — otherwise raw scores grow without limit and one category lifts its
  // ENTIRE set above everything, segregating the feed. Affinity shifts the odds;
  // the diversity pass + exploration guarantee variety.
  const maxOf = (m: Record<string, number>) => Math.max(1, ...Object.values(m).map((v) => Math.max(0, v)));
  const maxCat = maxOf(categoryScores);
  const maxBrand = maxOf(brandScores);
  const maxStyle = maxOf(styleScores);
  const catAff = (c: string) => Math.max(0, categoryScores[c] ?? 0) / maxCat;
  const brandAff = (b: string) => Math.max(0, brandScores[b] ?? 0) / maxBrand;
  const styleAff = (p: Product) =>
    Math.max(0, ...styleTags(p).map((t) => Math.max(0, styleScores[t] ?? 0) / maxStyle), 0);

  // ~60% taste / 40% exploration. `pref` is a weighted 0..1 blend of the three
  // affinities; PREF (max preference weight) > EXPLORE (random) → taste-leaning,
  // while the diversity pass keeps any one category ≤ ~40%.
  const PREF = 9;
  const EXPLORE = 6;
  const ranked = products
    .map((p) => {
      const pref = 0.4 * catAff(p.category) + 0.3 * brandAff((p.brand || '').trim()) + 0.3 * styleAff(p);
      return { p, score: pref * PREF + Math.random() * EXPLORE };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);

  // Final safety net: rolling-window caps (≤2 category / ≤3 shop per 5).
  // Applied to the head only (what people actually scroll) to keep it cheap.
  const HEAD = 400;
  return [...diversify(ranked.slice(0, HEAD)), ...ranked.slice(HEAD)];
}

/** Diversity pass — rolling-window caps so no single category or shop can
 * dominate even when engagement scores are heavily skewed: at most `maxCat`
 * of one category and `maxShop` of one shop within any `window` consecutive
 * posts. Picks the highest-ranked candidate that fits; relaxes if none does. */
function diversify(sorted: Product[], window = 5, maxCat = 2, maxShop = 3): Product[] {
  const pool = sorted.slice();
  const out: Product[] = [];
  while (pool.length) {
    const recent = out.slice(-window);
    let idx = pool.findIndex((p) => {
      const catCount = recent.filter((r) => r.category === p.category).length;
      const shopCount = recent.filter((r) => r.shop.name === p.shop.name).length;
      return catCount < maxCat && shopCount < maxShop;
    });
    if (idx === -1) idx = 0; // nothing fits the window — take the best available
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function applyFilter(products: Product[], filter: FeedFilter | null): Product[] {
  if (!filter) return products;
  const { matchesStyles } = require('../lib/productStyle') as typeof import('../lib/productStyle');
  return products.filter((p) => {
    if (filter.categories.length > 0 && !filter.categories.includes(p.category)) return false;
    if (filter.brands.length > 0 && !filter.brands.includes((p.brand || '').trim())) return false;
    if (filter.styles.length > 0 && !matchesStyles(p, filter.styles)) return false;
    return productMatchesQuery(p, filter.query); // multi-word, diacritics-free
  });
}

/** An all-empty filter means "no filter". */
function normalize(f: FeedFilter | null): FeedFilter | null {
  if (!f) return null;
  const empty =
    !f.query.trim() && f.categories.length === 0 && f.brands.length === 0 && f.styles.length === 0;
  return empty ? null : f;
}

type State = {
  products: Product[];      // full catalog
  feedProducts: Product[];  // what the HOME feed shows (filtered view)
  filter: FeedFilter | null;
  status: 'mock' | 'loading' | 'live';
  hydrate: () => Promise<void>;
  setFilter: (f: FeedFilter | null) => void;
};

export const useProductsStore = create<State>((set, get) => ({
  products: MOCK_PRODUCTS,
  feedProducts: MOCK_PRODUCTS,
  filter: null,
  status: 'mock',
  hydrate: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      const rows = await fetchProducts();
      if (rows.length > 0) {
        const ranked = rankForUser(rows);
        set({
          products: ranked,
          feedProducts: applyFilter(ranked, get().filter),
          status: 'live',
        });
      } else set({ status: 'mock' });
    } catch {
      set({ status: 'mock' }); // offline / not imported yet → keep what we have
    }
  },
  setFilter: (f) => {
    const filter = normalize(f);
    set({ filter, feedProducts: applyFilter(get().products, filter) });
  },
}));

/** Hook: FULL catalog (CREATE, tagging, helpers). */
export const useProducts = (): Product[] => useProductsStore((s) => s.products);

/** Hook: the HOME feed's (possibly filtered) product list. */
export const useFeedProducts = (): Product[] => useProductsStore((s) => s.feedProducts);

/** Hook: active feed filter (null = off). */
export const useFeedFilter = (): FeedFilter | null => useProductsStore((s) => s.filter);

/** Non-React getter for helpers/callbacks outside components. */
export const getAllProducts = (): Product[] => useProductsStore.getState().products;
