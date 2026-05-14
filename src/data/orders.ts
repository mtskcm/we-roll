import type { ShopKey } from '../theme/colors';

export type OrderStatus = 'delivered' | 'shipped' | 'processing';

export type Order = {
  id: string;
  date: string;
  shopName: ShopKey;
  itemCount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  productIds: string[];
};

export const ORDERS: Order[] = [
  {
    id: 'ord-2026-0089',
    date: '2026-05-10',
    shopName: 'Footshop',
    itemCount: 2,
    total: 258,
    currency: '€',
    status: 'delivered',
    productIds: ['p1', 'p11'],
  },
  {
    id: 'ord-2026-0076',
    date: '2026-04-22',
    shopName: 'Queens.sk',
    itemCount: 1,
    total: 189,
    currency: '€',
    status: 'delivered',
    productIds: ['p2'],
  },
  {
    id: 'ord-2026-0102',
    date: '2026-05-13',
    shopName: 'StockX',
    itemCount: 1,
    total: 489,
    currency: '€',
    status: 'shipped',
    productIds: ['p19'],
  },
  {
    id: 'ord-2026-0105',
    date: '2026-05-14',
    shopName: 'Hervis',
    itemCount: 2,
    total: 204,
    currency: '€',
    status: 'processing',
    productIds: ['p17', 'p18'],
  },
];
