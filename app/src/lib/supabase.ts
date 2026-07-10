// Minimal Supabase REST client for reading the products table.
// Anon key is public-safe (same key ships in the public landing page).
// Writes happen only via the importer with the service-role key — never here.

import type { Product } from '../types';
import type { ShopKey } from '../theme/colors';
import type { CategoryId } from '../data/categories';

export const SUPABASE_URL = 'https://hcrccagnnjeslnpmfdky.supabase.co';
export const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjcmNjYWdubmplc2xucG1mZGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTAyMjAsImV4cCI6MjA5NDkyNjIyMH0.9k6gCQnr2dHuzMxiRcL9j3WTYmLsGOqB9elWU2S-5fI';

type ProductRow = {
  id: string;
  ext_id: string;
  shop: string;
  brand: string | null;
  name: string;
  price_current: number | string | null;
  price_original: number | string | null;
  currency: string | null;
  image_url: string | null;
  image_alt_url: string | null;
  buy_url: string;
  category: string | null;
  in_stock: boolean | null;
};

const VALID_CATEGORIES = new Set<CategoryId>([
  'hoodies', 'tshirts', 'jackets', 'pants', 'shorts', 'sneakers', 'caps', 'accessories',
]);

function initialsOf(shop: string): string {
  return (
    shop
      .replace(/\.[a-z]+$/i, '')
      .split(/[\s.]+/)
      .slice(0, 2)
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase() || 'WE'
  );
}

// Stable pseudo "watching/likes" count so the UI badge isn't empty for feed data.
function stableLikes(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return 120 + (Math.abs(h) % 1800);
}

function rowToProduct(r: ProductRow): Product {
  const current = r.price_current != null ? Number(r.price_current) : 0;
  const original = r.price_original != null ? Number(r.price_original) : undefined;
  const category = (r.category && VALID_CATEGORIES.has(r.category as CategoryId)
    ? (r.category as CategoryId)
    : 'accessories') as CategoryId;
  return {
    id: r.id,
    shop: { name: r.shop as ShopKey, url: r.buy_url, initials: initialsOf(r.shop) },
    brand: r.brand ?? '',
    name: r.name,
    price: { current, original, currency: r.currency ?? 'EUR' },
    image: r.image_url ? { uri: r.image_url } : require('../assets/images/product-1.jpg'),
    likes: stableLikes(r.id),
    takeItUrl: r.buy_url,
    category,
  };
}

/**
 * Fetch products from Supabase. Throws on network/HTTP error; returns [] if empty.
 *
 * PostgREST caps each response at 1000 rows, so we page through by `id` (a
 * stable, unique key — avoids the row skips/dupes that offset+updated_at ties
 * cause) until the catalog is loaded or `max` is reached. Ordering here doesn't
 * matter for display: the store shuffles so every shop/category interleaves.
 */
export async function fetchProducts(max = 6000): Promise<Product[]> {
  const PAGE = 1000;
  const rows: ProductRow[] = [];
  let after = '';
  while (rows.length < max) {
    const cursor = after ? `&id=gt.${encodeURIComponent(after)}` : '';
    const url =
      `${SUPABASE_URL}/rest/v1/products` +
      `?select=*&order=id.asc&limit=${PAGE}${cursor}`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!res.ok) throw new Error(`Supabase products fetch failed: HTTP ${res.status}`);
    const page = (await res.json()) as ProductRow[];
    rows.push(...page);
    if (page.length < PAGE) break; // last page
    after = page[page.length - 1].id;
  }
  return rows.map(rowToProduct);
}
