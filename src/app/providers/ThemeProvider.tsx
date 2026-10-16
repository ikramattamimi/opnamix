import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Tema terang/gelap untuk seluruh aplikasi. Pilihan disimpan di localStorage
// dengan kunci yang sama seperti sebelumnya supaya pilihan lama tetap terbaca.

const STORAGE_KEY = 'darkMode';

interface ThemeContextValue {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// localStorage bisa melempar error (mode privat, storage diblokir)
function readStoredDarkMode(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) === true : false;
  } catch {
    return false;
  }
}

function storeDarkMode(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Abaikan: tema tetap berlaku untuk sesi ini walau tidak tersimpan
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(readStoredDarkMode);

  useEffect(() => {
    storeDarkMode(isDarkMode);
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => setIsDarkMode((prev) => !prev), []);

  const value = useMemo(
    () => ({ isDarkMode, setIsDarkMode, toggleDarkMode }),
    [isDarkMode, toggleDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook berpasangan dengan provider
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme harus dipakai di dalam ThemeProvider');
  return context;
}
