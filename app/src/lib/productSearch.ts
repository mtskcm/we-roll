// productSearch — multi-word, diacritics-insensitive product matching.
// "nike tricko" → every token must hit the brand / name / shop / category
// (category matching understands EN + SK synonyms), so it returns all Nike tees.
// Used by Discover search AND the feed FilterSheet query.

import type { CategoryId } from '../data/categories';
import type { Product } from '../types';

/** lowercase + strip diacritics ("Tričko" → "tricko"). */
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// EN + SK words people actually type for each category.
const CATEGORY_TERMS: Record<CategoryId, string> = {
  tshirts: 'tee tees tshirt t-shirt shirt tricko tricka triko polo tielko',
  hoodies: 'hoodie hoodies crewneck sweater mikina mikiny sveter pulover rolak',
  jackets: 'jacket jackets coat parka vest bunda bundy kabat vesta softshell',
  pants: 'pants trousers jeans joggers chino nohavice teplaky rifle kalhoty leginy',
  shorts: 'shorts kratasy sortky',
  sneakers: 'shoes sneakers boots sandals tenisky topanky obuv boty sandale slapky',
  caps: 'cap caps hat beanie siltovka ciapka cepice klobuk',
  accessories: 'accessories bag backpack socks glasses doplnky taska ruksak batoh ponozky okuliare opasok',
};

/** True when EVERY word of the query matches the product somewhere. */
export function productMatchesQuery(p: Product, query: string): boolean {
  const q = norm(query.trim());
  if (!q) return true;
  const hay = norm(
    `${p.brand} ${p.name} ${p.shop.name} ${p.category} ${CATEGORY_TERMS[p.category] ?? ''}`,
  );
  return q.split(/\s+/).every((token) => hay.includes(token));
}
