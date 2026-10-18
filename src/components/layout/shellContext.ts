import { createContext, useContext } from 'react';

// Kerangka aplikasi membagikan kendali laci sidebar (layar HP) ke header halaman.
export interface ShellContextValue {
  openDrawer: () => void;
}

export const ShellContext = createContext<ShellContextValue>({ openDrawer: () => {} });

export const useShell = () => useContext(ShellContext);
