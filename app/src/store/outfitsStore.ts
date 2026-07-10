// outfitsStore — the FITS feed's source of truth.
// Seeds with the local mock OUTFITS so the feed always renders; hydrate()
// pulls published outfits (+ owner profile) from Supabase and puts them FIRST
// (newest on top), keeping mocks below so the feed stays lively pre-launch.

import { create } from 'zustand';
import { OUTFITS, type UserOutfit } from '../data/outfits';
import { SUPABASE_ANON, SUPABASE_URL } from '../lib/supabase';

const TINTS = ['#E63946', '#22D3EE', '#A78BFA', '#FF6B2C', '#FF3D8A', '#3B82F6'];

function tintOf(handle: string): string {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

type OutfitRow = {
  id: string;
  caption: string | null;
  image_url: string;
  tagged_product_ids: string[] | null;
  likes_count: number;
  created_at: string;
  profiles: { handle: string; initials: string } | null;
};

function rowToOutfit(r: OutfitRow): UserOutfit {
  const handle = r.profiles?.handle ?? 'werol';
  return {
    id: r.id,
    ownerHandle: handle,
    ownerInitials: r.profiles?.initials ?? 'WE',
    ownerTint: tintOf(handle),
    image: { uri: r.image_url },
    caption: r.caption ?? '',
    likes: r.likes_count ?? 0,
    savedCount: 0,
    createdAt: Date.parse(r.created_at) || Date.now(),
    taggedProductIds: r.tagged_product_ids ?? [],
    comments: [],
  };
}

type State = {
  outfits: UserOutfit[];
  status: 'mock' | 'loading' | 'live';
  hydrate: () => Promise<void>;
};

export const useOutfitsStore = create<State>((set, get) => ({
  outfits: OUTFITS,
  status: 'mock',
  hydrate: async () => {
    if (get().status === 'loading') return;
    const prev = get().status;
    set({ status: 'loading' });
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/outfits` +
          `?select=id,caption,image_url,tagged_product_ids,likes_count,created_at,profiles(handle,initials)` +
          `&order=created_at.desc&limit=100`,
        { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } },
      );
      if (!res.ok) throw new Error(`outfits fetch ${res.status}`);
      const rows = (await res.json()) as OutfitRow[];
      set({ outfits: [...rows.map(rowToOutfit), ...OUTFITS], status: 'live' });
    } catch {
      set({ status: prev === 'live' ? 'live' : 'mock' }); // offline → keep what we have
    }
  },
}));

export const useOutfits = (): UserOutfit[] => useOutfitsStore((s) => s.outfits);
