import type { ImageSourcePropType } from 'react-native';
import type { ShopKey } from '../theme/colors';
import type { CategoryId } from '../data/categories';

export type Product = {
  id: string;
  shop: {
    name: ShopKey;
    url: string;
    initials: string;
  };
  brand: string;
  name: string;
  price: {
    current: number;
    original?: number;
    currency: string;
  };
  image: ImageSourcePropType;
  likes: number;
  takeItUrl: string;
  category: CategoryId;
  creatorId?: string;
};

export type Creator = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  followers: number;
  outfits: number;
  tint: string;
  bio: string;
};

export type MessageType = 'price_drop' | 'restock' | 'new_collection';

export type Message = {
  id: string;
  shopName: ShopKey;
  type: MessageType;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  productId?: string;
  shopUrl?: string;
};

export type UserProfile = {
  name: string;
  handle: string;
  initials: string;
  joinedAt: string;
};

export type Friend = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
};

export type OutfitSlotId = 'head' | 'top' | 'mid' | 'bottom' | 'feet';

export type SlotMap = Partial<Record<OutfitSlotId, string>>;

export type Outfit = {
  id: string;
  name: string;
  slots: SlotMap;
  createdAt: number;
};
