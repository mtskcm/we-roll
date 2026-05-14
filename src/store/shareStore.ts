import { create } from 'zustand';
import type { Product } from '../types';

type State = {
  product: Product | null;
  toastMessage: string | null;
};

type Actions = {
  openShare: (product: Product) => void;
  closeShare: () => void;
  showToast: (message: string) => void;
  hideToast: () => void;
};

export const useShareStore = create<State & Actions>((set) => ({
  product: null,
  toastMessage: null,
  openShare: (product) => set({ product }),
  closeShare: () => set({ product: null }),
  showToast: (message) => set({ toastMessage: message, product: null }),
  hideToast: () => set({ toastMessage: null }),
}));
