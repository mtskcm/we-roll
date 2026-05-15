import type { CategoryId } from './categories';
import type { OutfitSlotId } from '../types';

export type SlotDef = {
  id: OutfitSlotId;
  label: string;
  // Categories that can fill this slot
  categories: CategoryId[];
  // Position on mannequin (x%, y%)
  x: number;
  y: number;
};

export const OUTFIT_SLOTS: SlotDef[] = [
  { id: 'head', label: 'HEAD', categories: ['caps', 'accessories'], x: 50, y: 8 },
  { id: 'top', label: 'TOP', categories: ['hoodies', 'tshirts', 'jackets'], x: 50, y: 28 },
  { id: 'mid', label: 'MID', categories: ['jackets', 'hoodies'], x: 50, y: 45 },
  { id: 'bottom', label: 'BOTTOM', categories: ['pants', 'shorts'], x: 50, y: 65 },
  { id: 'feet', label: 'FEET', categories: ['sneakers'], x: 50, y: 90 },
];

export const SLOT_BY_ID: Record<OutfitSlotId, SlotDef> = Object.fromEntries(
  OUTFIT_SLOTS.map((s) => [s.id, s]),
) as Record<OutfitSlotId, SlotDef>;
