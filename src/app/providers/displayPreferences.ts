// Preferensi tampilan (tema dan ukuran) dan cara membacanya dari localStorage.
// Dipisah dari ThemeProvider supaya bisa diuji tanpa DOM.

export type ThemePreference = 'light' | 'system' | 'dark';
export type ResolvedTheme = 'light' | 'dark';
export type SizePreference = 'standar' | 'besar';

export const THEME_STORAGE_KEY = 'opnamix.theme';
export const SIZE_STORAGE_KEY = 'opnamix.size';
// Kunci lama (boolean JSON) dari versi yang hanya punya terang/gelap
export const LEGACY_DARK_MODE_KEY = 'darkMode';

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Terang' },
  { value: 'system', label: 'Sistem' },
  { value: 'dark', label: 'Gelap' },
];

export const SIZE_OPTIONS: { value: SizePreference; label: string }[] = [
  { value: 'standar', label: 'Standar' },
  { value: 'besar', label: 'Besar' },
];

type StorageReader = Pick<Storage, 'getItem'>;

function safeGet(storage: StorageReader, key: string): string | null {
  // localStorage bisa melempar error (mode privat, storage diblokir)
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function readThemePreference(storage: StorageReader): ThemePreference {
  const saved = safeGet(storage, THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'system' || saved === 'dark') return saved;

  // Pengguna lama: pilihan terang/gelap yang tersimpan tetap dihormati
  const legacy = safeGet(storage, LEGACY_DARK_MODE_KEY);
  if (legacy === 'true') return 'dark';
  if (legacy === 'false') return 'light';
  return 'system';
}

export function readSizePreference(storage: StorageReader): SizePreference {
  return safeGet(storage, SIZE_STORAGE_KEY) === 'besar' ? 'besar' : 'standar';
}

export function resolveTheme(theme: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark ? 'dark' : 'light';
  return theme;
}
