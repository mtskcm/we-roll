// ordersStore — pieces the user bought THROUGH WEROL (i.e. tapped BUY and was
// sent to the shop). This is the source for "pin a product from your orders"
// when posting an own-photo fit, and later for order history on the profile.
// Local-first; server sync can come with the social phase.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Product } from '../types';

export type Order = {
  productId: string;
  brand: string;
  name: string;
  at: number; // timestamp of the BUY click-through
};

type State = {
  orders: Order[];
  addOrder: (product: Product) => void;
};

export const useOrdersStore = create<State>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (product) =>
        set((s) => ({
          orders: [
            { productId: product.id, brand: product.brand, name: product.name, at: Date.now() },
            // keep newest first, dedupe repeat clicks on the same piece
            ...s.orders.filter((o) => o.productId !== product.id),
          ].slice(0, 200),
        })),
    }),
    {
      name: 'werol-orders-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useOrders = (): Order[] => useOrdersStore((s) => s.orders);
