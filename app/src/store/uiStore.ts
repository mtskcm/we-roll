// Ephemeral UI chrome state — not persisted.
// chromeHidden = true while user is actively scrolling the feed (hides BottomNav).
// zenMode     = true while the user long-presses a feed photo (hides ALL chrome).

import { create } from 'zustand';

type State = { chromeHidden: boolean; zenMode: boolean };
type Actions = {
  setChromeHidden: (v: boolean) => void;
  setZenMode: (v: boolean) => void;
};

export const useUiStore = create<State & Actions>((set) => ({
  chromeHidden: false,
  zenMode: false,
  setChromeHidden: (v) => set({ chromeHidden: v }),
  setZenMode: (v) => set({ zenMode: v }),
}));
