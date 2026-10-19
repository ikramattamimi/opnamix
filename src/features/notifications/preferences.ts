import { useSyncExternalStore } from 'react';

// Preferensi notifikasi per perangkat: suara dan notifikasi desktop saat
// notifikasi baru masuk. Disimpan di localStorage. Dibaca dari halaman
// Notifikasi, Profil, dan handler realtime, jadi semua pemakai berbagi satu
// sumber lewat useSyncExternalStore.

export interface NotificationPreferences {
  sound: boolean;
  desktop: boolean;
}

export const NOTIFICATION_PREFS_KEY = 'opnamix.notificationPrefs';
const DEFAULTS: NotificationPreferences = { sound: true, desktop: true };

type StorageLike = Pick<Storage, 'getItem'>;

export function parseNotificationPreferences(raw: string | null): NotificationPreferences {
  if (!raw) return DEFAULTS;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return DEFAULTS;
    const v = value as Partial<Record<keyof NotificationPreferences, unknown>>;
    return {
      sound: typeof v.sound === 'boolean' ? v.sound : DEFAULTS.sound,
      desktop: typeof v.desktop === 'boolean' ? v.desktop : DEFAULTS.desktop,
    };
  } catch {
    return DEFAULTS;
  }
}

function readStored(storage?: StorageLike): NotificationPreferences {
  try {
    return parseNotificationPreferences((storage ?? localStorage).getItem(NOTIFICATION_PREFS_KEY));
  } catch {
    // Storage diblokir: pakai bawaan
    return DEFAULTS;
  }
}

let current: NotificationPreferences | null = null;
const listeners = new Set<() => void>();

export function getNotificationPreferences(): NotificationPreferences {
  current ??= readStored();
  return current;
}

export function setNotificationPreference<K extends keyof NotificationPreferences>(
  key: K,
  value: NotificationPreferences[K],
) {
  current = { ...getNotificationPreferences(), [key]: value };
  try {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(current));
  } catch {
    // Abaikan: tetap berlaku untuk sesi ini
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNotificationPreferences(): NotificationPreferences {
  return useSyncExternalStore(subscribe, getNotificationPreferences);
}
