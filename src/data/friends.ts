import type { Friend } from '../types';

const AVATAR = (n: number) => `https://i.pravatar.cc/150?img=${n}`;

export const FRIENDS: Friend[] = [
  { id: 'f1', name: 'Jakub', handle: '@kubo', avatar: AVATAR(8) },
  { id: 'f2', name: 'Nina', handle: '@nina.k', avatar: AVATAR(20) },
  { id: 'f3', name: 'Peťo', handle: '@pheto', avatar: AVATAR(13) },
  { id: 'f4', name: 'Veronika', handle: '@vera', avatar: AVATAR(36) },
  { id: 'f5', name: 'Dávid', handle: '@dejvo', avatar: AVATAR(14) },
  { id: 'f6', name: 'Simona', handle: '@simi', avatar: AVATAR(44) },
  { id: 'f7', name: 'Tomáš', handle: '@tomo', avatar: AVATAR(7) },
  { id: 'f8', name: 'Lea', handle: '@lealea', avatar: AVATAR(32) },
];
