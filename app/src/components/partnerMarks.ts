// Lookup: shop name -> partner-mark SVG component.
// Returns undefined for shops without a brand mark; callers should fall back to a dot.

import type React from 'react';
import type { SvgProps } from 'react-native-svg';
import AboutYouMark from '../assets/partners/aboutyou.svg';
import FootshopMark from '../assets/partners/footshop.svg';
import QueensMark from '../assets/partners/queens.svg';
import ZalandoMark from '../assets/partners/zalando.svg';
import type { ShopKey } from '../theme/colors';

type Mark = React.FC<SvgProps>;

const MARKS: Partial<Record<ShopKey, Mark>> = {
  Footshop: FootshopMark,
  'Queens.sk': QueensMark,
  Zalando: ZalandoMark,
  'About You': AboutYouMark,
};

export function getPartnerMark(shop: ShopKey): Mark | undefined {
  return MARKS[shop];
}
