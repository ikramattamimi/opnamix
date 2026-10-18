import { useCallback, useEffect, useState } from 'react';

// State yang disimpan di localStorage (pin sidebar/header, grafik diciutkan, dll.).
// Nilai disimpan sebagai JSON; nilai rusak atau storage yang diblokir jatuh ke bawaan.

function read<T>(key: string, fallback: T, isValid?: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (isValid ? isValid(parsed) : typeof parsed === typeof fallback) return parsed as T;
  } catch {
    // Abaikan: pakai bawaan
  }
  return fallback;
}

export function usePersistentState<T>(
  key: string,
  fallback: T,
  isValid?: (value: unknown) => value is T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback, isValid));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Abaikan: tetap berlaku untuk sesi ini
    }
  }, [key, value]);

  const set = useCallback((next: T | ((prev: T) => T)) => setValue(next), []);
  return [value, set];
}
