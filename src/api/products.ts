import { PRODUCTS } from '../data/products';
import type { Product } from '../types';

export async function getProducts(): Promise<Product[]> {
  return PRODUCTS;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return PRODUCTS.find((p) => p.id === id);
}

export async function searchProducts(q: string): Promise<Product[]> {
  const query = q.trim().toLowerCase();
  if (!query) return PRODUCTS;
  return PRODUCTS.filter(
    (p) =>
      p.brand.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.shop.name.toLowerCase().includes(query),
  );
}
