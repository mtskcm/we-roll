// shareProduct — native OS share sheet (Instagram, WhatsApp, Messenger, …).
// Shares the piece + its shop link; replaces the old in-app "send to friends"
// sheet per design feedback.

import { Share } from 'react-native';
import { formatPrice } from './format';
import type { Product } from '../types';

export function shareProduct(product: Product): void {
  const price = formatPrice(product.price.current, product.price.currency);
  Share.share({
    message: `${product.brand ? `${product.brand} — ` : ''}${product.name} · ${price}\nFound on WEROL: ${product.takeItUrl}`,
  }).catch(() => {});
}
