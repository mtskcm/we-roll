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
  const { categoryScores, brandScores } = getEngagement();
  const hasSignals =
    Object.keys(categoryScores).length > 0 || Object.keys(brandScores).length > 0;
  if (!hasSignals) return shuffle(products);

  return products
    .map((p) => ({
      p,
      score:
        (categoryScores[p.category] ?? 0) +
        (brandScores[(p.brand || '').trim()] ?? 0) * 1.2 +
        Math.random() * 6, // exploration — keeps the feed from becoming a bubble
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

function applyFilter(products: Product[], filter: FeedFilter | null): Product[] {
  if (!filter) return products;
  return products.filter((p) => {
    if (filter.categories.length > 0 && !filter.categories.includes(p.category)) return false;
    if (filter.brands.length > 0 && !filter.brands.includes((p.brand || '').trim())) return false;
    return productMatchesQuery(p, filter.query); // multi-word, diacritics-free
  });
}

/** An all-empty filter means "no filter". */
function normalize(f: FeedFilter | null): FeedFilter | null {
  if (!f) return null;
  const empty = !f.query.trim() && f.categories.length === 0 && f.brands.length === 0;
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
