// "Time my answers": one on/off preference for the answer countdown, remembered in this browser
// and shared by every component that reads it (question pages and the exam intro).
import { useCallback, useSyncExternalStore } from 'react';
import { storage } from '@/shared/lib/storage';

const KEY = 'qa-oral-timer';
const listeners = new Set<() => void>();

const read = () => storage.get<boolean>(KEY, true);
const serverSnapshot = () => true;

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useTimerPreference(): readonly [boolean, (on: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, read, serverSnapshot);
  const setEnabled = useCallback((on: boolean) => {
    storage.set(KEY, on);
    listeners.forEach((l) => l());
  }, []);
  return [enabled, setEnabled] as const;
}
