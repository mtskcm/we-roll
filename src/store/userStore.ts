import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { USER } from '../data/profile';
import type { UserProfile } from '../types';

export type Sizes = {
  top: string | null;
  bottom: string | null;
  shoes: string | null;
};

type State = {
  isAuthenticated: boolean;
  profile: UserProfile;
  email: string | null;
  sizes: Sizes;
  followedBrands: string[];
};

type Actions = {
  login: (email: string) => void;
  register: (email: string, name: string) => void;
  logout: () => void;
  setSize: (key: keyof Sizes, value: string | null) => void;
  toggleBrand: (brand: string) => void;
};

export const useUserStore = create<State & Actions>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      profile: USER,
      email: null,
      sizes: { top: 'M', bottom: '32', shoes: '43' },
      followedBrands: ['Nike', 'Carhartt WIP', 'Stüssy'],
      login: (email) => set({ isAuthenticated: true, email }),
      register: (email, name) => {
        const trimmed = name.trim();
        const initials = trimmed
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p.charAt(0).toUpperCase())
          .join('') || trimmed.slice(0, 2).toUpperCase() || 'WE';
        const handle = '@' + (email.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
        set({
          isAuthenticated: true,
          email,
          profile: {
            name: trimmed || (email.split('@')[0] ?? 'WEROL user'),
            handle,
            initials,
            joinedAt: new Date().toISOString().slice(0, 10),
          },
        });
      },
      logout: () =>
        set({
          isAuthenticated: false,
          email: null,
        }),
      setSize: (key, value) =>
        set((s) => ({ sizes: { ...s.sizes, [key]: value } })),
      toggleBrand: (brand) =>
        set((s) => ({
          followedBrands: s.followedBrands.includes(brand)
            ? s.followedBrands.filter((b) => b !== brand)
            : [...s.followedBrands, brand],
        })),
    }),
    {
      name: 'werol-user-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
