import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type State = {
  liked: string[];
  saved: string[];
  currentIndex: number;
  swipeHintDismissed: boolean;
  pendingFeedIndex: number | null;
  recentSearches: string[];
};

type Actions = {
  toggleLike: (id: string) => void;
  toggleSaved: (id: string) => void;
  setCurrentIndex: (idx: number) => void;
  dismissSwipeHint: () => void;
  requestFeedIndex: (idx: number) => void;
  consumePendingFeedIndex: () => number | null;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
};

export const useFeedStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      liked: [],
      saved: [],
      currentIndex: 0,
      swipeHintDismissed: false,
      pendingFeedIndex: null,
      recentSearches: [],
      addRecentSearch: (q) => {
        const query = q.trim();
        if (query.length < 2) return;
        set((s) => ({
          recentSearches: [query, ...s.recentSearches.filter((x) => x !== query)].slice(0, 5),
        }));
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
      toggleLike: (id) =>
        set((s) => ({
          liked: s.liked.includes(id) ? s.liked.filter((x) => x !== id) : [...s.liked, id],
        })),
      toggleSaved: (id) =>
        set((s) => ({
          saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id],
        })),
      setCurrentIndex: (idx) => set({ currentIndex: idx }),
      dismissSwipeHint: () => {
        if (!get().swipeHintDismissed) set({ swipeHintDismissed: true });
      },
      requestFeedIndex: (idx) => set({ pendingFeedIndex: idx }),
      consumePendingFeedIndex: () => {
        const idx = get().pendingFeedIndex;
        if (idx !== null) set({ pendingFeedIndex: null });
        return idx;
      },
    }),
    {
      name: 'werol-feed-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        liked: s.liked,
        saved: s.saved,
        swipeHintDismissed: s.swipeHintDismissed,
        recentSearches: s.recentSearches,
      }),
    },
  ),
);

export const useIsLiked = (id: string) =>
  useFeedStore((s) => s.liked.includes(id));
export const useIsSaved = (id: string) =>
  useFeedStore((s) => s.saved.includes(id));
