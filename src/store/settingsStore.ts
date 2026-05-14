import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Language = 'sk' | 'en';
export type ThemeMode = 'dark' | 'light';

type State = {
  notificationsEnabled: boolean;
  language: Language;
  theme: ThemeMode;
};

type Actions = {
  toggleNotifications: () => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: ThemeMode) => void;
};

export const useSettingsStore = create<State & Actions>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      language: 'sk',
      theme: 'dark',
      toggleNotifications: () =>
        set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),
      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'werol-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
