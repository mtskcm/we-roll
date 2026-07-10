import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Language = 'sk' | 'en';

type State = {
  notificationsEnabled: boolean;
  language: Language;
};

type Actions = {
  toggleNotifications: () => void;
  setLanguage: (lang: Language) => void;
};

export const useSettingsStore = create<State & Actions>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      language: 'en',
      toggleNotifications: () =>
        set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'werol-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
