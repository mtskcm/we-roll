// Ephemeral UI chrome state — not persisted.
// chromeHidden = true while the user is actively scrolling the feed (hides BottomNav).

import { create } from 'zustand';

type State = { chromeHidden: boolean };
type Actions = { setChromeHidden: (v: boolean) => void };

export const useUiStore = create<State & Actions>((set) => ({
  chromeHidden: false,
  setChromeHidden: (v) => set({ chromeHidden: v }),
}));
