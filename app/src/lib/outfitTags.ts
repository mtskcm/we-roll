// Resolves an outfit's tagged products against the CURRENT catalog.
// Mock outfits tag mock ids (p1..p22); after Supabase hydration the catalog
// holds live ids ('4f:...'), so direct lookups miss. Unresolved tags fall back
// to deterministic picks from the live catalog (seeded by outfit id) so the
// "Shop the look" strip always shows real, openable products — and the feed
// and detail screens agree on the same set.

import type { UserOutfit } from '../data/outfits';
import type { Product } from '../types';

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function resolveTaggedProducts(outfit: UserOutfit, products: Product[]): Product[] {
  if (products.length === 0) return [];
  const out: Product[] = [];
  const used = new Set<string>();
  outfit.taggedProductIds.forEach((id, i) => {
    let product = products.find((p) => p.id === id);
    if (!product) {
      const start = hash(outfit.id) + i * 7;
      for (let step = 0; step < products.length; step++) {
        const candidate = products[(start + step) % products.length];
        if (!used.has(candidate.id)) {
          product = candidate;
          break;
        }
      }
    }
    if (product && !used.has(product.id)) {
      used.add(product.id);
      out.push(product);
    }
  });
  return out;
}
