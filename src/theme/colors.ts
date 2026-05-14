export const DARK_COLORS = {
  ink: '#0c0c0a',
  ink2: '#141412',
  ink3: '#1c1c1a',
  ink4: '#262622',
  stone: '#3a3a36',
  cream: '#f0ebe1',
  cream2: '#e2dbd0',
  cream3: '#c8c1b4',
  teal: '#2ec4a0',
  teal2: '#22a888',
  dim: '#484844',
  dimmer: '#2c2c29',
  likeRed: '#e05b5b',
  glassBg: 'rgba(20,20,18,0.65)',
  glassBorder: 'rgba(255,255,255,0.07)',
  glassActive: 'rgba(46,196,160,0.2)',
  imagePlaceholder: '#f0ebe1',
} as const;

export const LIGHT_COLORS = {
  ink: '#f5f1ea',
  ink2: '#ffffff',
  ink3: '#e8e3d8',
  ink4: '#d6cfbf',
  stone: '#9c958c',
  cream: '#1a1a18',
  cream2: '#3a3a36',
  cream3: '#6b6760',
  teal: '#1f8f7a',
  teal2: '#157062',
  dim: '#8b8780',
  dimmer: '#c4bfb4',
  likeRed: '#d44848',
  glassBg: 'rgba(255,255,255,0.75)',
  glassBorder: 'rgba(0,0,0,0.08)',
  glassActive: 'rgba(31,143,122,0.18)',
  imagePlaceholder: '#ffffff',
} as const;

export const COLORS = DARK_COLORS;

export type ShopKey =
  | 'Footshop'
  | 'Queens.sk'
  | 'Freshment'
  | 'Sizeer'
  | 'Zalando'
  | 'About You'
  | 'Hervis'
  | 'StockX';

export const SHOP_COLORS: Record<ShopKey, { bg: string; text: string }> = {
  Footshop: { bg: '#e8c84a', text: '#1a1700' },
  'Queens.sk': { bg: '#4a90e2', text: '#f0ebe1' },
  Freshment: { bg: '#c8e87a', text: '#1a2800' },
  Sizeer: { bg: '#8b8fa3', text: '#f0ebe1' },
  Zalando: { bg: '#ff6900', text: '#0c0c0a' },
  'About You': { bg: '#f5b800', text: '#0c0c0a' },
  Hervis: { bg: '#c8102e', text: '#f0ebe1' },
  StockX: { bg: '#006f42', text: '#f0ebe1' },
};
