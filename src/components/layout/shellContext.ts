import { createContext, useContext } from 'react';

// Kerangka aplikasi membagikan kendali laci sidebar (layar HP) ke header halaman,
// dan status pin sidebar ke elemen yang menempel di bawah layar (CartBar).
export interface ShellContextValue {
  openDrawer: () => void;
  sidebarPinned: boolean;
}

export const ShellContext = createContext<ShellContextValue>({
  openDrawer: () => {},
  sidebarPinned: false,
});

export const useShell = () => useContext(ShellContext);
