// Brand → real logo asset. Shown as a small white badge on dark UI.
// Curated for now (single shop); when multi-brand lands we switch to the
// feed's per-product shop logo (TradeDoubler programLogo) via a DB column.

import type { ImageSourcePropType } from 'react-native';

const LOGOS: Record<string, ImageSourcePropType> = {
  '4f': require('../assets/brands/4f.jpg'),
};

export function getBrandLogo(brand: string | undefined): ImageSourcePropType | undefined {
  if (!brand) return undefined;
  return LOGOS[brand.trim().toLowerCase()];
}
