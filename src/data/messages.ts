import type { Message, MessageType } from '../types';
import type { ShopKey } from '../theme/colors';

const now = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

type LivePool = {
  shopName: ShopKey;
  type: MessageType;
  title: string;
  body: string;
  productId?: string;
};

export const LIVE_MESSAGE_POOL: LivePool[] = [
  {
    shopName: 'Footshop',
    type: 'price_drop',
    title: 'Carhartt WIP zľava 17%',
    body: 'Detroit Jacket Black za 249 € (predtým 299 €).',
    productId: 'p5',
  },
  {
    shopName: 'Queens.sk',
    type: 'new_collection',
    title: 'Stüssy SS26 drop',
    body: 'Nová Stüssy kolekcia online — najlepšie kúsky idú rýchlo.',
    productId: 'p8',
  },
  {
    shopName: 'Freshment',
    type: 'restock',
    title: 'Wood Wood Owen späť',
    body: 'Owen Denim Jacket — všetky veľkosti opäť dostupné.',
    productId: 'p12',
  },
  {
    shopName: 'Sizeer',
    type: 'price_drop',
    title: 'New Balance 530 zľava',
    body: 'Steel Grey za 139 € — limitovaný čas.',
    productId: 'p9',
  },
  {
    shopName: 'Footshop',
    type: 'new_collection',
    title: 'Patagonia Better Sweater',
    body: 'Fleece collection na zimnú sezónu — 12 farieb.',
    productId: 'p10',
  },
  {
    shopName: 'Queens.sk',
    type: 'restock',
    title: 'Adidas Samba OG',
    body: 'White Green späť — populárny model, neváhaj.',
    productId: 'p7',
  },
  {
    shopName: 'Freshment',
    type: 'price_drop',
    title: 'Stüssy Logo Tee -15%',
    body: 'Basic Stock Logo Tee teraz 49 €.',
    productId: 'p8',
  },
  {
    shopName: 'Sizeer',
    type: 'new_collection',
    title: 'North Face Norm Cap',
    body: 'Norm Cap Black — nová čiapka v ponuke.',
    productId: 'p11',
  },
];

export const SEED_MESSAGES: Message[] = [
  {
    id: 'm1',
    shopName: 'Footshop',
    type: 'price_drop',
    title: 'Cena klesla o 19%',
    body: 'Thrasher World Tour Hoodie je teraz za 129 € (predtým 159 €).',
    timestamp: now - 12 * MIN,
    read: false,
    productId: 'p1',
  },
  {
    id: 'm2',
    shopName: 'Queens.sk',
    type: 'restock',
    title: 'Späť na sklade',
    body: 'Nike Shox TL / White Silver je opäť dostupný vo veľkostiach 42–45.',
    timestamp: now - 2 * HOUR,
    read: false,
    productId: 'p2',
  },
  {
    id: 'm3',
    shopName: 'Freshment',
    type: 'new_collection',
    title: 'Nová kolekcia: Ripndip',
    body: 'Ripndip Must Be Nice — najnovší zip hoodie z jarnej kolekcie.',
    timestamp: now - 5 * HOUR,
    read: false,
    productId: 'p3',
  },
  {
    id: 'm4',
    shopName: 'Sizeer',
    type: 'price_drop',
    title: 'Výpredaj Reebok',
    body: 'Training Shorts Navy zľava o 29% — len 39 € namiesto 55 €.',
    timestamp: now - 1 * DAY,
    read: true,
    productId: 'p4',
  },
  {
    id: 'm5',
    shopName: 'Footshop',
    type: 'new_collection',
    title: 'Carhartt WIP drop',
    body: 'Detroit Jacket Black — workwear klasika v limitovanej edícii.',
    timestamp: now - 2 * DAY,
    read: true,
    productId: 'p5',
  },
  {
    id: 'm6',
    shopName: 'Queens.sk',
    type: 'restock',
    title: "Levi's 501 Original Fit",
    body: 'Vintage strih jeans späť na sklade — všetky veľkosti.',
    timestamp: now - 3 * DAY,
    read: true,
    productId: 'p6',
  },
];
