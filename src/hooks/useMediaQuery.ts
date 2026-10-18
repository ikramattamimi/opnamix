import { useSyncExternalStore } from 'react';

// true selama media query cocok, ikut berubah saat layar diubah ukurannya.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Titik henti yang dipakai kerangka aplikasi
export const MOBILE_QUERY = '(max-width: 767px)';
