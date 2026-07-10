// engagementStore — the recommendation algorithm's PRIVATE signal aggregates.
// Per Matúš's product spec, the algorithm learns from: like · save · share ·
// click-through (detail open / BUY) · dwell time on a feed post. Likes are
// never shown publicly. HARD RULE: while a feed filter is active
// (productsStore.filter !== null), NOTHING is recorded — filtered browsing
// must not distort taste.
//
// v1 keeps compact per-category and per-brand score aggregates (not a raw
// event log) — enough for client-side feed ranking; a server-side event log
// can come later.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Product } from '../types';

export type EngagementType =
  | 'like'
  | 'unlike'
  | 'save'
  | 'unsave'
  | 'share'
  | 'click'  // opened product detail
  | 'buy'    // tapped BUY (affiliate click-through)
  | 'dwell'; // watched a feed post (pass seconds)

const WEIGHTS: Record<EngagementType, number> = {
  like: 3,
  unlike: -3,
  save: 4,
  unsave: -4,
  share: 5,
  click: 2,
  buy: 6,
  dwell: 0, // computed from seconds
};

/** Dwell weight: 0 under 3s, then gentle growth capped at 1.5 — passive
 * scrolling must not drown out explicit signals (like/save/buy). */
const dwellWeight = (seconds: number) => (seconds < 3 ? 0 : Math.min(1.5, seconds / 8));

type State = {
  categoryScores: Record<string, number>;
  brandScores: Record<string, number>;
  eventCount: number;
  record: (product: Product, type: EngagementType, seconds?: number) => void;
  /** Seed brand taste from onboarding picks. */
  seedBrands: (brands: string[]) => void;
};

export const useEngagementStore = create<State>()(
  persist(
    (set, get) => ({
      categoryScores: {},
      brandScores: {},
      eventCount: 0,

      record: (product, type, seconds = 0) => {
        // Filter rule — filtered browsing never feeds the algorithm.
        // (lazy require to avoid a module-init import cycle)
        const { useProductsStore } = require('./productsStore') as typeof import('./productsStore');
        if (useProductsStore.getState().filter !== null) return;

        const w = type === 'dwell' ? dwellWeight(seconds) : WEIGHTS[type];
        if (!w) return;

        const cat = product.category;
        const brand = (product.brand || '').trim();
        set((s) => ({
          categoryScores: { ...s.categoryScores, [cat]: (s.categoryScores[cat] ?? 0) + w },
          brandScores: brand
            ? { ...s.brandScores, [brand]: (s.brandScores[brand] ?? 0) + w }
            : s.brandScores,
          eventCount: s.eventCount + 1,
        }));
      },

      seedBrands: (brands) =>
        set((s) => {
          const next = { ...s.brandScores };
          for (const b of brands) {
            const key = b.trim();
            if (key) next[key] = (next[key] ?? 0) + 3;
          }
          return { brandScores: next };
        }),
    }),
    {
      name: 'werol-engagement-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Non-React accessor for ranking helpers. */
export const getEngagement = () => useEngagementStore.getState();
