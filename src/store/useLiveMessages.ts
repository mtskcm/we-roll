import { useEffect } from 'react';
import { useMessagesStore } from './messagesStore';
import { useSettingsStore } from './settingsStore';

const INTERVAL_MS = 15_000;

export function useLiveMessages() {
  const pushLiveMessage = useMessagesStore((s) => s.pushLiveMessage);
  const enabled = useSettingsStore((s) => s.notificationsEnabled);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => {
      pushLiveMessage();
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [pushLiveMessage, enabled]);
}
