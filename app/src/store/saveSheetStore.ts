// saveSheetStore — which product the global "Save to collection" sheet is for.
// Bookmark taps call openFor(product); App.tsx renders one SaveToCollectionSheet.

import { create } from 'zustand';
import type { Product } from '../types';

type State = {
  product: Product | null;
  openFor: (p: Product) => void;
  close: () => void;
};

export const useSaveSheetStore = create<State>((set) => ({
  product: null,
  openFor: (p) => set({ product: p }),
  close: () => set({ product: null }),
}));
