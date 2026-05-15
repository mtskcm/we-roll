export const DARK_COLORS = {
  ink: '#000000',
  ink2: '#0A0A0C',
  ink3: '#161618',
  ink4: '#1F1F22',
  stone: '#2A2A2E',
  cream: '#FFFFFF',
  cream2: '#A0A0A6',
  cream3: '#6E6E73',
  teal: '#D6FF3D',
  teal2: '#B8E61F',
  liveGreen: '#22C55E',
  dim: '#4A4A4E',
  dimmer: '#1A1A1C',
  likeRed: '#FF4757',
  glassBg: 'rgba(10,10,12,0.65)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassActive: 'rgba(214,255,61,0.18)',
  imagePlaceholder: '#F5F1EA',
} as const;

export const LIGHT_COLORS = {
  ink: '#F5F1EA',
  ink2: '#FFFFFF',
  ink3: '#E8E3D8',
  ink4: '#D6CFBF',
  stone: '#9C958C',
  cream: '#0A0A0C',
  cream2: '#4A4A4E',
  cream3: '#6E6E73',
  teal: '#5BB000',
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
  Footshop: { bg: '#E8C84A', text: '#1A1700' },
  'Queens.sk': { bg: '#4A90E2', text: '#F0EBE1' },
  Freshment: { bg: '#C8E87A', text: '#1A2800' },
  Sizeer: { bg: '#8B8FA3', text: '#F0EBE1' },
  Zalando: { bg: '#FF6900', text: '#0C0C0A' },
  'About You': { bg: '#F5B800', text: '#0C0C0A' },
  Hervis: { bg: '#C8102E', text: '#F0EBE1' },
  StockX: { bg: '#006F42', text: '#F0EBE1' },
};
