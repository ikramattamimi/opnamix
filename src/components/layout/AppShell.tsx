import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePersistentState } from '@/hooks/usePersistentState';
import { MOBILE_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { ShellContext } from './shellContext';

// Kerangka aplikasi: sidebar tetap di kiri, isi halaman digulir oleh window
// (supaya header halaman bisa menempel), dan scrim untuk laci sidebar di HP.

const PIN_KEY = 'opnamix.sidebar.pin';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [pinned, setPinned] = usePersistentState(PIN_KEY, false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const shell = useMemo(() => ({ openDrawer }), [openDrawer]);

  // Pindah halaman: tutup laci dan mulai dari atas
  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <ShellContext.Provider value={shell}>
      <Sidebar
        pinned={pinned}
        onTogglePin={() => setPinned((prev) => !prev)}
        isMobile={isMobile}
        drawerOpen={drawerOpen}
        onCloseDrawer={closeDrawer}
      />
      <div
        className={cn(
          'fixed inset-0 z-[35] bg-scrim transition-opacity duration-200 md:hidden',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeDrawer}
        aria-hidden
      />
      <main
        className={cn(
          'min-h-dvh pb-7 pt-3 transition-[margin] duration-200 ease-out',
          'pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]',
          pinned ? 'md:ml-sbw' : 'md:ml-rail',
        )}
      >
        {children}
      </main>
    </ShellContext.Provider>
  );
};
