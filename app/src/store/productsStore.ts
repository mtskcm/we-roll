// Products store — single source of truth for the catalog.
// Seeds with the local mock so the app always renders; hydrate() pulls real
// rows from Supabase and replaces the array (keeps mock on empty/error).

import { create } from 'zustand';
import { PRODUCTS as MOCK_PRODUCTS } from '../data/products';
import { fetchProducts } from '../lib/supabase';
import type { Product } from '../types';

type State = {
  products: Product[];
  status: 'mock' | 'loading' | 'live';
  hydrate: () => Promise<void>;
};

export const useProductsStore = create<State>((set, get) => ({
  products: MOCK_PRODUCTS,
  status: 'mock',
  hydrate: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      const rows = await fetchProducts();
      if (rows.length > 0) set({ products: rows, status: 'live' });
      else set({ status: 'mock' });
    } catch {
      set({ status: 'mock' }); // offline / not imported yet → keep mock
    }
  },
}));

/** Hook: current catalog array (re-renders when hydrate swaps in live data). */
export const useProducts = (): Product[] => useProductsStore((s) => s.products);

/** Non-React getter for helpers/callbacks outside components. */
export const getAllProducts = (): Product[] => useProductsStore.getState().products;
