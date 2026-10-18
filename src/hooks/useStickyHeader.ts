import { useCallback, useEffect, useRef } from 'react';
import { usePersistentState } from './usePersistentState';

// Perilaku header halaman (PageHeader):
// - menempel di atas saat halaman digulir (data-stuck)
// - gulir turun → ringkas, hanya baris judul (data-compact)
// - pointer di atas header ringkas → intip versi lengkap yang melayang di atas isi
//   tanpa mendorongnya (data-peek); di layar sentuh cukup ketuk area kosong header
// - kembali lengkap saat di paling atas, atau selalu lengkap kalau di-pin
// - halaman pendek tidak diringkas supaya header tidak bolak-balik berubah ukuran
//
// Status ditulis sebagai atribut data-* dan gaya inline langsung ke elemen, bukan
// lewat state React, supaya pengukuran tinggi dan animasinya terjadi dalam satu frame.
// Gaya per status ada di `.page-header` (src/index.css).

const PIN_KEY = 'opnamix.header.pin';
const ANIM_MS = 260;
// Tinggi header ringkas kira-kira (px), dipakai menghitung apakah halaman cukup panjang
const COMPACT_ESTIMATE = 52;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setFlag = (el: HTMLElement, name: string, on: boolean) => {
  if (on) el.setAttribute(`data-${name}`, '');
  else el.removeAttribute(`data-${name}`);
};
const hasFlag = (el: HTMLElement, name: string) => el.hasAttribute(`data-${name}`);

// Tinggi tanpa transisi, sebagai titik awal animasi
const freezeHeight = (el: HTMLElement, px: number, marginBottom?: number) => {
  el.style.transition = 'none';
  el.style.height = `${px}px`;
  if (marginBottom !== undefined) el.style.marginBottom = `${marginBottom}px`;
  void el.offsetHeight;
  el.style.transition = '';
};

export function useStickyHeader() {
  const ref = useRef<HTMLElement>(null);
  const [pinned, setPinned] = usePersistentState(PIN_KEY, false);
  const pinnedRef = useRef(pinned);
  const hoverRef = useRef(false);

  // Diisi oleh efek di bawah supaya handler pointer bisa memakainya
  const peekRef = useRef<{ open: () => void; close: (instant?: boolean) => void }>({
    open: () => {},
    close: () => {},
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const state = {
      lastY: window.scrollY,
      acc: 0,
      ignore: false,
      compactH: 0,
      expandedH: 0,
      peekTimer: 0,
      growTimer: 0,
      ignoreTimer: 0,
    };

    const syncHeightVar = () => {
      const h = hasFlag(el, 'peek') ? state.compactH : el.offsetHeight;
      document.documentElement.style.setProperty(
        '--page-header-h',
        `${hasFlag(el, 'stuck') ? h : 0}px`,
      );
    };

    const scrollFix = (dy: number) => {
      const y0 = window.scrollY;
      window.scrollBy(0, dy);
      if (window.scrollY !== y0) {
        state.ignore = true;
        window.clearTimeout(state.ignoreTimer);
        state.ignoreTimer = window.setTimeout(() => (state.ignore = false), 120);
      }
    };

    const peekOpen = () => {
      if (!hasFlag(el, 'compact')) return;
      window.clearTimeout(state.peekTimer);
      if (hasFlag(el, 'peek')) {
        el.style.height = `${state.expandedH}px`;
        el.style.marginBottom = `${state.compactH - state.expandedH}px`;
        return;
      }
      const c = el.offsetHeight;
      state.compactH = c;
      el.style.height = `${c}px`;
      setFlag(el, 'peek', true);
      setFlag(el, 'anim', true);
      const e = el.scrollHeight;
      state.expandedH = e;
      void el.offsetHeight;
      el.style.height = `${e}px`;
      el.style.marginBottom = `${c - e}px`;
    };

    const peekClose = (instant = false) => {
      if (!hasFlag(el, 'peek')) return;
      window.clearTimeout(state.peekTimer);
      const done = () => {
        setFlag(el, 'peek', false);
        setFlag(el, 'anim', false);
        el.style.height = '';
        el.style.marginBottom = '';
      };
      if (instant || reducedMotion()) return done();
      el.style.height = `${state.compactH}px`;
      el.style.marginBottom = '0px';
      state.peekTimer = window.setTimeout(done, ANIM_MS);
    };

    peekRef.current = { open: peekOpen, close: peekClose };

    const canCompact = () => {
      const shrink = el.offsetHeight - COMPACT_ESTIMATE;
      const room = document.documentElement.scrollHeight - window.innerHeight - shrink;
      return room > 60;
    };

    const setCompact = (on: boolean) => {
      peekClose(true);
      window.clearTimeout(state.growTimer);
      setFlag(el, 'grow', false);
      el.style.height = '';
      if (on) {
        // Tinggi di alur halaman langsung ringkas (scroll dikoreksi supaya isi diam),
        // lalu bagian bawah header menyusut perlahan seperti intip yang ditutup.
        const e = el.offsetHeight;
        setFlag(el, 'compact', true);
        const c = el.offsetHeight;
        state.compactH = c;
        state.expandedH = e;
        setFlag(el, 'peek', true);
        setFlag(el, 'anim', true);
        freezeHeight(el, e, c - e);
        if (window.scrollY > 8) scrollFix(c - e);
        peekClose();
      } else {
        const c = el.offsetHeight;
        setFlag(el, 'compact', false);
        const e = el.offsetHeight;
        if (window.scrollY > 8) scrollFix(e - c);
        else if (!reducedMotion()) {
          // Kembali ke paling atas: header tumbuh perlahan, isi ikut turun
          setFlag(el, 'anim', true);
          setFlag(el, 'grow', true);
          freezeHeight(el, c);
          el.style.height = `${e}px`;
          state.growTimer = window.setTimeout(() => {
            setFlag(el, 'anim', false);
            setFlag(el, 'grow', false);
            el.style.height = '';
            syncHeightVar();
          }, ANIM_MS);
        }
      }
      state.acc = 0;
      syncHeightVar();
    };

    const onScroll = () => {
      const y = window.scrollY;
      const stuck = y > 4;
      if (stuck !== hasFlag(el, 'stuck')) setFlag(el, 'stuck', stuck);
      const compact = hasFlag(el, 'compact');

      // Kembali ke paling atas selalu diproses, walau bertepatan dengan koreksi scroll
      if (compact && y < 8) {
        state.ignore = false;
        state.lastY = y;
        return setCompact(false);
      }
      if (state.ignore) {
        state.ignore = false;
        state.lastY = y;
        return;
      }

      const dy = y - state.lastY;
      state.lastY = y;
      state.acc = Math.sign(dy) === Math.sign(state.acc) ? state.acc + dy : dy;

      if (pinnedRef.current) {
        if (compact) setCompact(false);
        else syncHeightVar();
        return;
      }
      if (compact && dy > 0 && !hoverRef.current && hasFlag(el, 'peek')) peekClose();
      if (
        !compact &&
        !hoverRef.current &&
        state.acc > 40 &&
        y > el.offsetHeight + 24 &&
        canCompact()
      ) {
        setCompact(true);
      } else syncHeightVar();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(state.peekTimer);
      window.clearTimeout(state.growTimer);
      window.clearTimeout(state.ignoreTimer);
      document.documentElement.style.setProperty('--page-header-h', '0px');
    };
  }, []);

  useEffect(() => {
    pinnedRef.current = pinned;
    // Di-pin saat sedang ringkas: langsung kembali lengkap
    if (pinned) window.dispatchEvent(new Event('scroll'));
  }, [pinned]);

  const onMouseEnter = useCallback(() => {
    hoverRef.current = true;
    peekRef.current.open();
  }, []);

  const onMouseLeave = useCallback((event: React.MouseEvent) => {
    hoverRef.current = false;
    // Pindah ke popover milik header (mis. notifikasi) tidak dihitung keluar
    const next = event.relatedTarget;
    if (next instanceof Element && next.closest('[data-header-popover]')) return;
    peekRef.current.close();
  }, []);

  // Layar sentuh: ketuk area kosong header ringkas untuk mengintip
  const onClick = useCallback((event: React.MouseEvent) => {
    if (event.target instanceof Element && event.target.closest('button, input, a, label')) return;
    peekRef.current.open();
  }, []);

  const togglePin = useCallback(() => setPinned((prev) => !prev), [setPinned]);

  return { ref, pinned, togglePin, onMouseEnter, onMouseLeave, onClick };
}
