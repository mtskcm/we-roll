import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import { USER } from '../data/profile';
import type { Outfit, OutfitSlotId, SlotMap, UserProfile } from '../types';

export type Sizes = {
  top: string | null;
  bottom: string | null;
  shoes: string | null;
};

type AuthResult = { error?: string; needsConfirm?: boolean };

type State = {
  isAuthenticated: boolean;
  authReady: boolean;          // bootstrap finished (avoids auth-screen flash)
  userId: string | null;
  profile: UserProfile;
  email: string | null;
  preferences: Record<string, unknown>;
  needsOnboarding: boolean;
  sizes: Sizes;
  followedBrands: string[];
  draftOutfit: SlotMap;
  savedOutfits: Outfit[];
};

type Actions = {
  bootstrap: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
  savePreferences: (prefs: Record<string, unknown>) => Promise<void>;
  setSize: (key: keyof Sizes, value: string | null) => void;
  toggleBrand: (brand: string) => void;
  setSlot: (slot: OutfitSlotId, productId: string | undefined) => void;
  clearDraftOutfit: () => void;
  saveOutfit: (name?: string, image?: string) => void;
  deleteOutfit: (id: string) => void;
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') ||
  name.slice(0, 2).toUpperCase() || 'WE';

export const useUserStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      authReady: false,
      userId: null,
      profile: USER,
      email: null,
      preferences: {},
      needsOnboarding: false,
      sizes: { top: 'M', bottom: '32', shoes: '43' },
      followedBrands: ['Nike', 'Carhartt WIP', 'Stüssy'],
      draftOutfit: {},
      savedOutfits: [],

      bootstrap: async () => {
        try {
          const { data } = await supabase.auth.getSession();
          const session = data.session;
          if (session?.user) {
            set({ isAuthenticated: true, userId: session.user.id, email: session.user.email ?? null });
            await get().loadProfile(session.user.id);
          } else {
            set({ isAuthenticated: false, userId: null });
          }
        } catch {
          set({ isAuthenticated: false });
        } finally {
          set({ authReady: true });
        }
      },

      signUp: async (email, password, name) => {
        const trimmed = name.trim();
        const handle = slug(trimmed || email.split('@')[0] || 'user');
        const initials = initialsOf(trimmed || email.split('@')[0] || 'WE');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: trimmed, handle, initials } },
        });
        if (error) return { error: error.message };
        if (data.session?.user) {
          set({ isAuthenticated: true, userId: data.session.user.id, email: data.session.user.email ?? null });
          await get().loadProfile(data.session.user.id);
          return {};
        }
        // email confirmation is enabled → no session yet
        return { needsConfirm: true };
      },

      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) return { error: error.message };
        set({ isAuthenticated: true, userId: data.user.id, email: data.user.email ?? null });
        await get().loadProfile(data.user.id);
        return {};
      },

      signInWithGoogle: async () => {
        // Lazy-loaded so the app still starts on a build that doesn't yet bundle
        // these native modules (Google just needs a rebuild to work).
        const WebBrowser = require('expo-web-browser') as typeof import('expo-web-browser');
        const Linking = require('expo-linking') as typeof import('expo-linking');
        try {
          const redirectTo = Linking.createURL('auth-callback');
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo, skipBrowserRedirect: true },
          });
          if (error || !data?.url) return { error: error?.message ?? 'Google sa nepodarilo spustiť' };
          const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
          if (res.type !== 'success' || !res.url) return { error: 'Prihlásenie zrušené' };
          const code = Linking.parse(res.url).queryParams?.code as string | undefined;
          if (!code) return { error: 'Chýba auth code z Google' };
          const { data: sess, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) return { error: exErr.message };
          const user = sess.session?.user;
          if (!user) return { error: 'Session sa nezískala' };
          set({ isAuthenticated: true, userId: user.id, email: user.email ?? null });
          await get().loadProfile(user.id);
          return {};
        } catch (e: any) {
          return { error: e?.message ?? 'Google chyba' };
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ isAuthenticated: false, userId: null, email: null, profile: USER, preferences: {}, needsOnboarding: false });
      },

      loadProfile: async (userId) => {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!data) return;
        const prefs = (data.preferences ?? {}) as Record<string, unknown>;
        set({
          profile: {
            name: data.name,
            handle: '@' + data.handle,
            initials: data.initials,
            joinedAt: (data.joined_at ?? '').slice(0, 10),
          },
          preferences: prefs,
          needsOnboarding: Object.keys(prefs).length === 0,
        });
      },

      savePreferences: async (prefs) => {
        const id = get().userId;
        if (id) await supabase.from('profiles').update({ preferences: prefs, updated_at: new Date().toISOString() }).eq('id', id);
        set({ preferences: prefs, needsOnboarding: false });
      },

      setSize: (key, value) => set((s) => ({ sizes: { ...s.sizes, [key]: value } })),
      toggleBrand: (brand) =>
        set((s) => ({
          followedBrands: s.followedBrands.includes(brand)
            ? s.followedBrands.filter((b) => b !== brand)
            : [...s.followedBrands, brand],
        })),
      setSlot: (slot, productId) =>
        set((s) => {
          const next = { ...s.draftOutfit };
          if (productId === undefined) delete next[slot];
          else next[slot] = productId;
          return { draftOutfit: next };
        }),
      clearDraftOutfit: () => set({ draftOutfit: {} }),
      saveOutfit: (name, image) =>
        set((s) => {
          const slots = s.draftOutfit;
          const count = Object.keys(slots).length;
          if (count === 0) return s;
          const num = s.savedOutfits.length + 1;
          const outfit: Outfit = {
            id: `fit-${Date.now()}`,
            name: name?.trim() || `FIT N°${num}`,
            slots: { ...slots },
            image,
            createdAt: Date.now(),
          };
          return { savedOutfits: [outfit, ...s.savedOutfits], draftOutfit: {} };
        }),
      deleteOutfit: (id) =>
        set((s) => ({ savedOutfits: s.savedOutfits.filter((o) => o.id !== id) })),
    }),
    {
      name: 'werol-user-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only local prefs/outfits; auth state comes from the Supabase session.
      partialize: (s) => ({
        sizes: s.sizes,
        followedBrands: s.followedBrands,
        draftOutfit: s.draftOutfit,
        savedOutfits: s.savedOutfits,
      }),
    },
  ),
);
