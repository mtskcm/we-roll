// Mock user-uploaded outfits for the FITS tab (other people's outfits feed).

import type { ImageSourcePropType } from 'react-native';
import { PRODUCTS } from './products';

// Curated full-body outfit photos for the FITS feed (mock community posts).
const OUTFIT_IMAGES: ImageSourcePropType[] = [
  require('../assets/outfits/fit1.jpg'),
  require('../assets/outfits/fit2.jpg'),
  require('../assets/outfits/fit3.jpg'),
  require('../assets/outfits/fit4.jpg'),
  require('../assets/outfits/fit5.jpg'),
  require('../assets/outfits/fit6.jpg'),
  require('../assets/outfits/fit7.jpg'),
  require('../assets/outfits/fit8.jpg'),
];

export type OutfitComment = {
  id: string;
  authorHandle: string;
  authorInitials: string;
  authorTint: string;
  body: string;
  createdAt: number;
};

export type UserOutfit = {
  id: string;
  ownerHandle: string;
  ownerInitials: string;
  ownerTint: string;
  image: ImageSourcePropType;
  caption: string;
  likes: number;
  savedCount: number;
  createdAt: number;
  /** Product IDs tagged in this outfit. */
  taggedProductIds: string[];
  comments: OutfitComment[];
};

const TINTS = ['#E63946', '#22D3EE', '#A78BFA', '#FF6B2C', '#FF3D8A', '#3B82F6'];

const HANDLES: Array<[string, string]> = [
  ['mira_k', 'MK'],
  ['jonas99', 'JV'],
  ['lea.r', 'LR'],
  ['tom_st', 'TS'],
  ['noemiii', 'NB'],
  ['dxn_', 'DH'],
  ['kubo', 'KB'],
  ['pheto', 'PT'],
  ['vera', 'VR'],
  ['dejvo', 'DJ'],
  ['simi', 'SM'],
  ['tomo', 'TO'],
];

const CAPTIONS = [
  'sunday vibes ✨',
  'all-black no apologies',
  'finally got these',
  'streetwear era',
  'fit check on the way home',
  'minimal but speaks loud',
  'cop or drop?',
  'paired this with my fav cap',
  'comfy + clean',
  'first drop of the season',
  'monochrome saturday',
  'this colorway is unreal',
];

const SAMPLE_COMMENTS: Array<[string, string, string]> = [
  ['kubo', 'KB', 'this slaps'],
  ['nina.k', 'NK', 'kúpila by si znova?'],
  ['dejvo', 'DJ', 'kde mas tie tenisky?'],
  ['simi', 'SM', '🔥🔥🔥'],
  ['tomo', 'TO', 'najsick fit dlho'],
  ['vera', 'VR', 'colour palette obsessed'],
];

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

function pickComments(seed: number): OutfitComment[] {
  const count = 1 + (seed % 4);
  return Array.from({ length: count }).map((_, i) => {
    const [handle, initials, body] = SAMPLE_COMMENTS[(seed + i) % SAMPLE_COMMENTS.length];
    return {
      id: `c-${seed}-${i}`,
      authorHandle: handle,
      authorInitials: initials,
      authorTint: TINTS[(seed + i) % TINTS.length],
      body,
      createdAt: now - (i + 1) * (60 * 60 * 1000),
    };
  });
}

function pickTagged(seed: number): string[] {
  const len = PRODUCTS.length;
  const count = 2 + (seed % 3);
  const set = new Set<string>();
  for (let i = 0; i < count; i++) {
    set.add(PRODUCTS[(seed + i * 3) % len].id);
  }
  return Array.from(set);
}

export const OUTFITS: UserOutfit[] = HANDLES.map(([handle, initials], i) => ({
  id: `o${i + 1}`,
  ownerHandle: handle,
  ownerInitials: initials,
  ownerTint: TINTS[i % TINTS.length],
  image: OUTFIT_IMAGES[i % OUTFIT_IMAGES.length],
  caption: CAPTIONS[i % CAPTIONS.length],
  likes: 80 + ((i * 137) % 920),
  savedCount: 10 + ((i * 53) % 180),
  createdAt: now - (i + 1) * 2 * (DAY / 3),
  taggedProductIds: pickTagged(i),
  comments: pickComments(i),
}));

export function getOutfitById(id: string): UserOutfit | undefined {
  return OUTFITS.find((o) => o.id === id);
}
