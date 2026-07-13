// productStyle — derive style tags for a product from its brand + name, since
// the feed XML has no structured style/fit field. Powers: (1) onboarding
// "vibes" → real feed personalization, (2) a Style filter, (3) the ranking's
// style-affinity term. Tags use the shared STYLE_OPTIONS vocabulary.

import type { Product } from '../types';

/** The single style vocabulary — used by onboarding, the filter and ranking. */
export const STYLE_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'streetwear', label: 'Streetwear' },
  { key: 'sporty', label: 'Sporty' },
  { key: 'outdoor', label: 'Outdoor' },
  { key: 'minimal', label: 'Minimal' },
  { key: 'vintage', label: 'Vintage' },
  { key: 'techwear', label: 'Techwear' },
  { key: 'y2k', label: 'Y2K' },
  { key: 'skate', label: 'Skate' },
  { key: 'elegant', label: 'Elegant' },
  { key: 'casual', label: 'Casual' },
  { key: 'grunge', label: 'Grunge' },
  { key: 'luxury', label: 'Luxury' },
];

const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Brand → broad styles (a brand can carry several).
const BRAND_STYLES: Record<string, string[]> = {
  nike: ['streetwear', 'sporty'],
  jordan: ['streetwear'],
  adidas: ['streetwear', 'sporty'],
  'new balance': ['streetwear', 'sporty'],
  puma: ['sporty', 'streetwear'],
  reebok: ['sporty', 'vintage'],
  asics: ['sporty', 'techwear'],
  hoka: ['sporty', 'outdoor'],
  saucony: ['sporty', 'vintage'],
  salomon: ['outdoor', 'techwear'],
  timberland: ['outdoor', 'streetwear'],
  'helly hansen': ['outdoor', 'techwear'],
  merrell: ['outdoor'],
  vans: ['skate', 'streetwear'],
  converse: ['skate', 'vintage', 'casual'],
  dickies: ['streetwear', 'skate', 'casual'],
  'carhartt wip': ['streetwear', 'casual'],
  carhartt: ['streetwear', 'casual'],
  'stussy': ['streetwear'],
  champion: ['streetwear', 'vintage', 'casual'],
  ellesse: ['vintage', 'sporty'],
  fila: ['vintage', 'sporty'],
  prosto: ['streetwear'],
  'the streets': ['streetwear'],
  '4f': ['sporty', 'casual'],
  "levi's": ['vintage', 'casual'],
  'levis': ['vintage', 'casual'],
  lacoste: ['elegant', 'vintage', 'casual'],
  clarks: ['elegant', 'vintage'],
  birkenstock: ['casual', 'minimal'],
  'dr. martens': ['grunge', 'streetwear'],
  'dr martens': ['grunge', 'streetwear'],
  ugg: ['casual', 'luxury'],
  'naked wolfe': ['luxury', 'streetwear'],
  'new era': ['streetwear', 'sporty'],
  eastpak: ['casual', 'streetwear'],
};

// Keyword in the (normalized) name → styles. Covers SK + EN.
const KEYWORD_STYLES: Array<[RegExp, string[]]> = [
  [/oversize|baggy|volny|siroky/, ['streetwear']],
  [/cargo|utility|technic/, ['techwear', 'streetwear']],
  [/crop|crop-top|crop top/, ['y2k', 'streetwear']],
  [/slim|basic|bez potlace|plain|zakladn/, ['minimal']],
  [/vintage|retro|heritage/, ['vintage']],
  [/softshell|waterproof|nepremok|windbreak|vetrovka|membran/, ['techwear', 'outdoor']],
  [/outdoor|trek|hiking|turist|hory|mountain/, ['outdoor']],
  [/skate/, ['skate']],
  [/elegant|formal|oxford|kosel|blaz|sako/, ['elegant']],
  [/tepak|joggers|mikina|hoodie|sport/, ['sporty', 'casual']],
];

/** Style tags for a product (unique). Empty when nothing matches. */
export function styleTags(product: Product): string[] {
  const set = new Set<string>();
  const brand = norm(product.brand);
  for (const [b, styles] of Object.entries(BRAND_STYLES)) {
    if (brand === b || brand.includes(b)) styles.forEach((s) => set.add(s));
  }
  const name = norm(product.name);
  for (const [re, styles] of KEYWORD_STYLES) {
    if (re.test(name)) styles.forEach((s) => set.add(s));
  }
  return [...set];
}

/** True when a product carries any of the requested style keys. */
export function matchesStyles(product: Product, styles: string[]): boolean {
  if (styles.length === 0) return true;
  const tags = styleTags(product);
  return styles.some((s) => tags.includes(s));
}
