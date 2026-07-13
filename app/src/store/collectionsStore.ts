// collectionsStore — user-made folders for saved products (Pinterest-style).
// A product in ≥1 collection is also "saved" (feedStore.saved stays the master
// bookmark flag, so useIsSaved / counts keep working). Local-first, persisted.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useFeedStore } from './feedStore';

export type Collection = {
  id: string;
  name: string;
  productIds: string[];
  createdAt: number;
};

type State = {
  collections: Collection[];
  create: (name: string) => string; // returns new id
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  /** Add/remove a product to/from a collection; keeps feedStore.saved in sync. */
  toggleMember: (collectionId: string, productId: string) => void;
};

let seq = 0;
const newId = () => `col-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const useCollectionsStore = create<State>()(
  persist(
    (set, get) => ({
      collections: [],

      create: (name) => {
        const id = newId();
        set((s) => ({
          collections: [
            { id, name: name.trim() || 'Untitled', productIds: [], createdAt: Date.now() },
            ...s.collections,
          ],
        }));
        return id;
      },

      rename: (id, name) =>
        set((s) => ({
          collections: s.collections.map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c)),
        })),

      remove: (id) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),

      toggleMember: (collectionId, productId) => {
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            const has = c.productIds.includes(productId);
            return {
              ...c,
              productIds: has ? c.productIds.filter((p) => p !== productId) : [productId, ...c.productIds],
            };
          }),
        }));
        // Keep the master saved flag in sync: saved iff in ≥1 collection.
        const stillIn = get().collections.some((c) => c.productIds.includes(productId));
        useFeedStore.getState().setSaved(productId, stillIn || useFeedStore.getState().saved.includes(productId));
        // If removed from its last collection AND not independently saved, it
        // stays saved only via the "All saved" toggle — handled elsewhere.
      },
    }),
    {
      name: 'werol-collections-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Collections that currently contain a product. */
export const useCollectionsForProduct = (productId: string): Collection[] =>
  useCollectionsStore((s) => s.collections.filter((c) => c.productIds.includes(productId)));

export const useCollections = (): Collection[] => useCollectionsStore((s) => s.collections);
