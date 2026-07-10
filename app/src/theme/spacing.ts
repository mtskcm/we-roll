// WEROL — spacing & radius (Edition 03). Base-4 scale per the UI kit; a touch
// airier than the kit HTML (we lean minimal). Radius: 12 / 16 / 20 / card 22 / pill.

export const SPACING = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 20,
  hero: 40,
} as const;

export const RADII = {
  sm: 12,
  md: 16,
  lg: 20,
  card: 22,
  sheet: 26,
  pill: 9999,
} as const;
