import { useSettingsStore } from '../store/settingsStore';
import { DARK_COLORS, LIGHT_COLORS } from './colors';

export function useColors() {
  const theme = useSettingsStore((s) => s.theme);
  return theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
}

export function useIsDark() {
  return useSettingsStore((s) => s.theme) === 'dark';
}
