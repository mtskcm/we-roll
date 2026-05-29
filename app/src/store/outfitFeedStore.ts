// outfitFeedStore — persisted likes/saves/follows for community outfits (FITS tab).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type State = {
  liked: string[];          // outfit IDs
  bookmarked: string[];     // outfit IDs
  followed: string[];       // user handles (without @)
};

type Actions = {
  toggleLike: (outfitId: string) => void;
  toggleBookmark: (outfitId: string) => void;
  toggleFollow: (handle: string) => void;
};

export const useOutfitFeedStore = create<State & Actions>()(
  persist(
    (set) => ({
      liked: [],
      bookmarked: [],
      followed: [],
      toggleLike: (outfitId) =>
        set((s) => ({
          liked: s.liked.includes(outfitId)
            ? s.liked.filter((x) => x !== outfitId)
            : [...s.liked, outfitId],
        })),
      toggleBookmark: (outfitId) =>
        set((s) => ({
          bookmarked: s.bookmarked.includes(outfitId)
            ? s.bookmarked.filter((x) => x !== outfitId)
            : [...s.bookmarked, outfitId],
        })),
      toggleFollow: (handle) =>
        set((s) => ({
          followed: s.followed.includes(handle)
            ? s.followed.filter((x) => x !== handle)
            : [...s.followed, handle],
        })),
    }),
    {
      name: 'werol-outfit-feed-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useIsOutfitLiked = (id: string) =>
  useOutfitFeedStore((s) => s.liked.includes(id));
export const useIsOutfitBookmarked = (id: string) =>
  useOutfitFeedStore((s) => s.bookmarked.includes(id));
export const useIsFollowed = (handle: string) =>
  useOutfitFeedStore((s) => s.followed.includes(handle));
