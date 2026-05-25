// Mock user-uploaded outfits for the FITS tab (other people's outfits feed).

import type { ImageSourcePropType } from 'react-native';
import { PRODUCTS } from './products';

export type UserOutfit = {
  id: string;
  ownerHandle: string;
  ownerInitials: string;
  ownerTint: string;
  image: ImageSourcePropType;
  likes: number;
  savedCount: number;
  createdAt: number;
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

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

export const OUTFITS: UserOutfit[] = HANDLES.map(([handle, initials], i) => ({
  id: `o${i + 1}`,
  ownerHandle: handle,
  ownerInitials: initials,
  ownerTint: TINTS[i % TINTS.length],
  image: PRODUCTS[i % PRODUCTS.length].image,
  likes: 80 + ((i * 137) % 920),
  savedCount: 10 + ((i * 53) % 180),
  createdAt: now - (i + 1) * (Math.floor(Math.random() * 6) + 1) * (DAY / 3),
}));
