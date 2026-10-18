import { useEffect, useLayoutEffect, useRef } from 'react';

// Escape menutup laci/sheet selama `active`
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onEscape();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onEscape]);
}

// Tinggi maksimum elemen menempel = sisa layar dari posisinya sekarang. Di
// puncak halaman elemen masih di bawah header yang belum menempel, jadi tinggi
// dari --page-header-h saja membuat kakinya (tombol Simpan) terdorong keluar layar.
// Dipakai panel ListWithPanel dan keranjang PosLayout.
export function useFitToViewport<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const fit = () => {
      const gap = parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.5;
      const top = Math.max(el.getBoundingClientRect().top, 0);
      el.style.maxHeight = `${window.innerHeight - top - gap}px`;
    };
    fit();
    window.addEventListener('scroll', fit, { passive: true });
    window.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('scroll', fit);
      window.removeEventListener('resize', fit);
      el.style.maxHeight = '';
    };
  }, [enabled]);

  return ref;
}
