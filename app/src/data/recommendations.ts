import { CATEGORIES, CATEGORY_LABEL, type CategoryId } from './categories';
import { PRODUCTS } from './products';
import type { Product } from '../types';
import type { ShopKey } from '../theme/colors';

function countBy<T extends string>(items: Array<T | undefined>): Map<T, number> {
  const m = new Map<T, number>();
  for (const it of items) {
    if (it === undefined) continue;
    m.set(it, (m.get(it) ?? 0) + 1);
  }
  return m;
}

function topKey<T>(map: Map<T, number>): T | null {
  let best: { key: T; count: number } | null = null;
  for (const [key, count] of map.entries()) {
    if (!best || count > best.count) best = { key, count };
  }
  return best?.key ?? null;
}

export type RecBucket = {
  key: string;
  title: string;
  subtitle?: string;
  products: Product[];
  tint?: string;
};

export function buildRecommendations(
  liked: string[],
  saved: string[],
  catalog: Product[] = PRODUCTS,
): RecBucket[] {
  const interactions = [...liked, ...saved];
  const interactedProducts = interactions
    .map((id) => catalog.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const buckets: RecBucket[] = [];

  // 1. For you — based on top liked/saved category
  const categoryCounts = countBy<CategoryId>(interactedProducts.map((p) => p.category));
  const topCategory = topKey(categoryCounts);
  if (topCategory) {
    const meta = CATEGORIES.find((c) => c.id === topCategory)!;
    const items = catalog.filter(
      (p) => p.category === topCategory && !interactions.includes(p.id),
    ).slice(0, 8);
    if (items.length > 0) {
      buckets.push({
        key: 'foryou',
        title: 'Pre teba',
        subtitle: `Viac z kategórie ${CATEGORY_LABEL[topCategory]}`,
        products: items,
        tint: meta.tint,
      });
    }
  } else {
    // Fallback: trending (top-liked products overall)
    const trending = [...catalog].sort((a, b) => b.likes - a.likes).slice(0, 8);
    buckets.push({
      key: 'trending',
      title: 'Trendy',
      subtitle: 'Najpopulárnejšie tento týždeň',
      products: trending,
    });
  }

  // 2. Trends in favorite shop
  const shopCounts = countBy<ShopKey>(interactedProducts.map((p) => p.shop.name));
  const topShop = topKey(shopCounts);
  if (topShop) {
    const items = catalog.filter((p) => p.shop.name === topShop && !interactions.includes(p.id))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 8);
    if (items.length > 0) {
      buckets.push({
        key: 'shop',
        title: `Trendy v ${topShop}`,
        subtitle: 'Tvoj obľúbený e-shop',
        products: items,
      });
    }
  }

  // 3. Discover by category — show a "Pozri tiež" with another category
  const otherCategories = CATEGORIES.filter((c) => c.id !== topCategory);
  if (otherCategories.length > 0) {
    const pick = otherCategories[0];
    const items = catalog.filter((p) => p.category === pick.id).slice(0, 6);
    if (items.length > 0) {
      buckets.push({
        key: `cat-${pick.id}`,
        title: `Pozri tiež: ${pick.label}`,
        products: items,
        tint: pick.tint,
      });
    }
  }

  return buckets;
}
