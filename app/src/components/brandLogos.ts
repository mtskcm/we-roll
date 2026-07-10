// Shop → real logo asset. Shown as a small white badge on dark UI (feed card,
// product detail). The feed badge represents the SHOP you buy from (the
// affiliate partner), not the garment's manufacturer — so a Timberland sneaker
// sold on Sizeer shows the Sizeer mark, and "BUY ON …" reads correctly.
//
// Each logo carries the badge shape that suits it:
//   aspect — badge width ÷ height (a compact mark like 4F fills a 2.1 chip; a
//            wide wordmark like Sizeer needs ~3.0 so it isn't cropped).
//   fit    — 'cover' fills (crops the mark's own whitespace), 'contain' shows
//            it whole. Logos sit on white, so 'contain' padding is invisible.
//
// Keys are normalised (lowercased, platform TLD like ".sk"/".cz" stripped) so
// both "4F" and "Sizeer.sk" resolve here. Drop a shop's logo in assets and add
// one line.

import type { ImageSourcePropType } from 'react-native';

export type ShopLogo = {
  source: ImageSourcePropType;
  aspect: number;
  fit?: 'cover' | 'contain';
};

const LOGOS: Record<string, ShopLogo> = {
  '4f': { source: require('../assets/brands/4f.jpg'), aspect: 2.1, fit: 'cover' },
  'sizeer': { source: require('../assets/logos/sizzer.png'), aspect: 2.98, fit: 'contain' },
};

/** Normalise a shop/brand string to a logo key: lowercase, drop a trailing TLD. */
export function shopLogoKey(name: string | undefined): string {
  return (name || '').trim().toLowerCase().replace(/\.(sk|cz|eu|com|pl|de)$/, '');
}

export function getBrandLogo(name: string | undefined): ShopLogo | undefined {
  if (!name) return undefined;
  return LOGOS[shopLogoKey(name)];
}
