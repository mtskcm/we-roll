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
        if (messages.length >= MAX_MESSAGES) return false;
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
        set({ messages: [newMsg, ...messages] });
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
