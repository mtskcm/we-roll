import type { Ionicons } from '@expo/vector-icons';

export type CategoryId =
  | 'hoodies'
  | 'tshirts'
  | 'jackets'
  | 'pants'
  | 'shorts'
  | 'sneakers'
  | 'caps'
  | 'accessories';

export type Category = {
  id: CategoryId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
};

export const CATEGORIES: Category[] = [
  { id: 'sneakers', label: 'Obuv', icon: 'walk', tint: '#2ec4a0' },
  { id: 'hoodies', label: 'Mikiny', icon: 'shirt', tint: '#e8c84a' },
  { id: 'tshirts', label: 'Tričká', icon: 'shirt-outline', tint: '#4a90e2' },
  { id: 'pants', label: 'Nohavice', icon: 'man', tint: '#8b8fa3' },
  { id: 'jackets', label: 'Bundy', icon: 'snow', tint: '#c8e87a' },
  { id: 'shorts', label: 'Šortky', icon: 'fitness', tint: '#e57373' },
  { id: 'caps', label: 'Čiapky', icon: 'baseball', tint: '#d59cff' },
  { id: 'accessories', label: 'Doplnky', icon: 'sparkles', tint: '#f4a261' },
];

export const PRIMARY_CATEGORIES: CategoryId[] = ['sneakers', 'hoodies', 'tshirts', 'pants'];

export const CATEGORY_LABEL: Record<CategoryId, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<CategoryId, string>;
