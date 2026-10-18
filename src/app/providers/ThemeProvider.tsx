import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  SIZE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  readSizePreference,
  readThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type SizePreference,
  type ThemePreference,
} from './displayPreferences';

// Preferensi tampilan untuk seluruh aplikasi: tema Terang / Sistem / Gelap dan
// ukuran Standar / Besar. Keduanya disimpan di localStorage dan diterapkan ke
// <html>: kelas `dark` untuk tema, `data-size="besar"` untuk ukuran (menaikkan
// font-size root, jadi semua ukuran berbasis rem ikut naik).

const DARK_QUERY = '(prefers-color-scheme: dark)';

interface ThemeContextValue {
  theme: ThemePreference;
  setTheme: (value: ThemePreference) => void;
  /** Tema yang benar-benar tampil setelah pilihan Sistem diterjemahkan */
  resolvedTheme: ResolvedTheme;
  isDarkMode: boolean;
  /** Beralih ke kebalikan tema yang sedang tampil (pilihan Sistem jadi eksplisit) */
  toggleDarkMode: () => void;
  size: SizePreference;
  setSize: (value: SizePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStorage(): Pick<Storage, 'getItem'> {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null };
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Abaikan: pilihan tetap berlaku untuk sesi ini walau tidak tersimpan
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.(DARK_QUERY).matches;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemePreference>(() => readThemePreference(getStorage()));
  const [size, setSize] = useState<SizePreference>(() => readSizePreference(getStorage()));
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const media = window.matchMedia?.(DARK_QUERY);
    if (!media) return;
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = resolveTheme(theme, systemDark);

  useEffect(() => {
    store(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    store(SIZE_STORAGE_KEY, size);
    if (size === 'besar') document.documentElement.dataset.size = 'besar';
    else delete document.documentElement.dataset.size;
  }, [size]);

  const toggleDarkMode = useCallback(
    () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    [resolvedTheme],
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      isDarkMode: resolvedTheme === 'dark',
      toggleDarkMode,
      size,
      setSize,
    }),
    [theme, resolvedTheme, toggleDarkMode, size],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook berpasangan dengan provider
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme harus dipakai di dalam ThemeProvider');
  return context;
}
