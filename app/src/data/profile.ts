import type { UserProfile } from '../types';

// Neutral placeholder shown only until the real profile loads (or if the
// profiles read fails) — never another person's identity.
export const USER: UserProfile = {
  name: 'WEROL člen',
  handle: '@werol',
  initials: 'W',
  joinedAt: '',
};
