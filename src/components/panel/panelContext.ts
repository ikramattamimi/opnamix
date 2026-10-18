import { createContext, useContext } from 'react';

// ListWithPanel memberi tahu SidePanel apakah sedang tampil sebagai laci
// (layar sempit), supaya tombol tutup hanya muncul saat dibutuhkan.
export interface PanelContextValue {
  isDrawer: boolean;
  close?: () => void;
}

export const PanelContext = createContext<PanelContextValue>({ isDrawer: false });
export const usePanelContext = () => useContext(PanelContext);
