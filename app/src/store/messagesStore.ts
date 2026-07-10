import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { LIVE_MESSAGE_POOL, SEED_MESSAGES } from '../data/messages';
import type { Message } from '../types';

const MAX_MESSAGES = 12;

type State = {
  messages: Message[];
};

type Actions = {
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  pushLiveMessage: () => boolean;
};

export const useMessagesStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      messages: SEED_MESSAGES,
      markAsRead: (id) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, read: true } : m)),
        })),
      markAllRead: () =>
        set((s) => ({ messages: s.messages.map((m) => ({ ...m, read: true })) })),
      pushLiveMessage: () => {
        const { messages } = get();
        const seedTitles = new Set(messages.map((m) => m.title));
        const candidates = LIVE_MESSAGE_POOL.filter((p) => !seedTitles.has(p.title));
        if (candidates.length === 0) return false;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const newMsg: Message = {
          id: `live-${Date.now()}`,
          shopName: pick.shopName,
          type: pick.type,
          title: pick.title,
          body: pick.body,
          timestamp: Date.now(),
          read: false,
          productId: pick.productId,
        };
        // Keep the newest MAX_MESSAGES — pruning the oldest lets titles rotate
        // back in, so the inbox never permanently stops receiving messages.
        set({ messages: [newMsg, ...messages].slice(0, MAX_MESSAGES) });
        return true;
      },
    }),
    {
      name: 'werol-messages-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useUnreadCount = () =>
  useMessagesStore((s) => s.messages.filter((m) => !m.read).length);
