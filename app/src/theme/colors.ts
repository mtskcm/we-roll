// WEROL — Brand color tokens (Edition 01 · 2026 · Maroš)
// Keys preserved for backward-compat with existing components.
// New canonical names available via `WEROL_TOKENS` for explicit usage.

export const DARK_COLORS = {
  // Mapped to new Maroš tokens
  ink: '#0A0A0C',          // pitch — primary canvas
  ink2: '#0A0A0C',          // pitch (alias)
  ink3: '#1F1F22',          // line — hairline / divider
  ink4: '#2A2A2E',          // line2 — emphasized hairline
  stone: '#16161A',         // concrete — secondary surface
  cream: '#FFFFFF',         // paper — primary light text
  cream2: '#A0A0A6',        // muted — body on dark
  cream3: '#6E6E73',        // muted2 — caption / chrome
  teal: '#D6FF3D',          // lime — signal · CTA · accent
  teal2: '#B8DD1A',         // lime pressed
  liveGreen: '#22C55E',     // live indicator (separate from CTA)
  dim: '#4A4A4E',
  dimmer: '#1A1A1C',
  likeRed: '#FF4757',
  glassBg: 'rgba(10,10,12,0.65)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassActive: 'rgba(214,255,61,0.18)',
  imagePlaceholder: '#16161A', // concrete (dark frame, replaces old cream bg)
} as const;

export const LIGHT_COLORS = {
  // Light mode (paper canvas) — for future use, not active yet
  ink: '#FFFFFF',
  ink2: '#FFFFFF',
  ink3: '#E8E3D8',
  ink4: '#D6CFBF',
  stone: '#F5F1EA',
  cream: '#0A0A0C',
  cream2: '#4A4A4E',
  cream3: '#6E6E73',
  teal: '#5BB000',          // darker lime for light mode contrast
  teal2: '#3F8800',
  liveGreen: '#16A34A',
  dim: '#8B8780',
  dimmer: '#C4BFB4',
  likeRed: '#D44848',
  glassBg: 'rgba(255,255,255,0.75)',
  glassBorder: 'rgba(0,0,0,0.08)',
  glassActive: 'rgba(91,176,0,0.18)',
  imagePlaceholder: '#FFFFFF',
} as const;

export const COLORS = DARK_COLORS;

// Canonical WEROL tokens (use directly when adding new code)
export const WEROL_TOKENS = {
  pitch: '#0A0A0C',
  paper: '#FFFFFF',
  lime: '#D6FF3D',
  limePressed: '#B8DD1A',
  concrete: '#16161A',
  line: '#1F1F22',
  line2: '#2A2A2E',
  muted: '#A0A0A6',
  muted2: '#6E6E73',
  // Partner tints
  tintOrange: '#FF6B2C',
  tintRed: '#E63946',
  tintYellow: '#F2C94C',
  tintSunset: '#FF7A2B',
  tintMagenta: '#FF3D8A',
  tintViolet: '#A78BFA',
  tintCyan: '#22D3EE',
} as const;

export type ShopKey =
  | 'Footshop'
  | 'Queens.sk'
  | 'Freshment'
  | 'Sizeer'
  | 'Zalando'
  | 'About You'
  | 'Hervis'
  | 'StockX';

// Mapped to Maroš's partner tint palette (accent-only)
export const SHOP_COLORS: Record<ShopKey, { bg: string; text: string }> = {
  Footshop: { bg: '#FF6B2C', text: '#0A0A0C' },    // T-01 orange
  'Queens.sk': { bg: '#E63946', text: '#FFFFFF' }, // T-02 red
  Freshment: { bg: '#F2C94C', text: '#0A0A0C' },   // T-03 yellow
  Sizeer: { bg: '#FF7A2B', text: '#0A0A0C' },      // T-04 sunset
  Zalando: { bg: '#FF3D8A', text: '#FFFFFF' },     // T-05 magenta
  'About You': { bg: '#A78BFA', text: '#0A0A0C' }, // T-06 violet
  Hervis: { bg: '#22D3EE', text: '#0A0A0C' },      // T-07 cyan
  StockX: { bg: '#FFFFFF', text: '#0A0A0C' },      // paper
};

// Safe accessor — real feed shops aren't in the fixed map above; fall back to
// a neutral chip so SHOP_COLORS[name] never returns undefined.
export function getShopColor(name: string): { bg: string; text: string } {
  return SHOP_COLORS[name as ShopKey] ?? { bg: '#2A2A2E', text: '#FFFFFF' };
}
