// WEROL — Brand color tokens (Edition 03 — "Streetwear app UI kit design-3")
// Single API: WEROL_TOKENS. Dark-only: pure black base, volt signal, soft
// surfaces. Token KEYS are stable (legacy names kept as aliases) so screens
// restyle themselves without mass renames.

export const WEROL_TOKENS = {
  pitch: '#000000',        // base / canvas (kit: Base #000)
  paper: '#FFFFFF',        // primary text
  lime: '#C9F73E',         // volt — primary / accent (kit: Volt)
  limePressed: '#B4E22A',  // volt pressed
  concrete: '#131417',     // surface 1 — card / chip
  surface2: '#1B1C20',     // surface 2 — sheet / input
  line: 'rgba(255,255,255,0.08)',  // hairline / divider / card border
  line2: 'rgba(255,255,255,0.12)', // emphasized hairline
  muted: '#9A9BA1',        // secondary text
  muted2: '#6A6B71',       // faint text / chrome
  body: '#D6D7DB',         // body copy on dark
  danger: '#FF5147',       // destructive
  scrim: 'rgba(0,0,0,0.55)', // modal / sheet backdrop
  frame: '#F3F3F5',        // light product-image frame
  liveGreen: '#22C55E',    // live indicator (separate from CTA)
  // Avatar pops / partner tints
  tintCyan: '#34D6E8',
  tintViolet: '#A855F7',
  tintOrange: '#FF6B2C',
  tintRed: '#FF5147',      // = danger
  tintYellow: '#F2C94C',
  tintSunset: '#FF7A2B',
  tintMagenta: '#FF3D8A',
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

// Mapped to the partner tint palette (accent-only)
export const SHOP_COLORS: Record<ShopKey, { bg: string; text: string }> = {
  Footshop: { bg: WEROL_TOKENS.tintOrange, text: WEROL_TOKENS.pitch },
  'Queens.sk': { bg: WEROL_TOKENS.tintRed, text: WEROL_TOKENS.paper },
  Freshment: { bg: WEROL_TOKENS.tintYellow, text: WEROL_TOKENS.pitch },
  Sizeer: { bg: WEROL_TOKENS.tintSunset, text: WEROL_TOKENS.pitch },
  Zalando: { bg: WEROL_TOKENS.tintMagenta, text: WEROL_TOKENS.paper },
  'About You': { bg: WEROL_TOKENS.tintViolet, text: WEROL_TOKENS.pitch },
  Hervis: { bg: WEROL_TOKENS.tintCyan, text: WEROL_TOKENS.pitch },
  StockX: { bg: WEROL_TOKENS.paper, text: WEROL_TOKENS.pitch },
};

// Safe accessor — real feed shops aren't in the fixed map above; fall back to
// a neutral chip so SHOP_COLORS[name] never returns undefined.
export function getShopColor(name: string): { bg: string; text: string } {
  return SHOP_COLORS[name as ShopKey] ?? { bg: WEROL_TOKENS.line2, text: WEROL_TOKENS.paper };
}
