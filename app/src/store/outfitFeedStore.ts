// outfitFeedStore — persisted likes/saves/follows/comments for community
// outfits (FITS tab). Local-first: everything lives on-device until the
// Supabase publish pipeline (Phase 5) syncs it.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { OutfitComment } from '../data/outfits';

const EMPTY_COMMENTS: OutfitComment[] = [];

type State = {
  liked: string[];          // outfit IDs
  bookmarked: string[];     // outfit IDs
  followed: string[];       // user handles (without @)
  comments: Record<string, OutfitComment[]>; // outfitId → my comments
};

type Actions = {
  toggleLike: (outfitId: string) => void;
  toggleBookmark: (outfitId: string) => void;
  toggleFollow: (handle: string) => void;
  addComment: (outfitId: string, comment: OutfitComment) => void;
};

export const useOutfitFeedStore = create<State & Actions>()(
  persist(
    (set) => ({
      liked: [],
      bookmarked: [],
      followed: [],
      comments: {},
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
      addComment: (outfitId, comment) =>
        set((s) => ({
          comments: {
            ...s.comments,
            [outfitId]: [...(s.comments[outfitId] ?? []), comment],
          },
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
export const useMyOutfitComments = (id: string) =>
  useOutfitFeedStore((s) => s.comments[id] ?? EMPTY_COMMENTS);
