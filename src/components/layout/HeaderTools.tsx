import React from 'react';
import { Moon, Pin, PinOff, Sun } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { GlobalSearch } from './GlobalSearch';
import { HeaderIconButton } from './HeaderIconButton';
import { NotificationBell } from './NotificationBell';

// Alat di kanan baris atas header: cari, pin header, tema, notifikasi.

interface HeaderToolsProps {
  pinned: boolean;
  onTogglePin: () => void;
}

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  return (
    <HeaderIconButton
      label={isDarkMode ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      onClick={toggleDarkMode}
    >
      {isDarkMode ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </HeaderIconButton>
  );
};

export const HeaderPinButton: React.FC<HeaderToolsProps> = ({ pinned, onTogglePin }) => (
  <HeaderIconButton
    data-header-pin=""
    aria-pressed={pinned}
    label={pinned ? 'Lepas kunci: header ringkas saat digulir' : 'Kunci header tetap lengkap'}
    onClick={onTogglePin}
  >
    {pinned ? <PinOff aria-hidden /> : <Pin aria-hidden />}
  </HeaderIconButton>
);

export const HeaderTools: React.FC<HeaderToolsProps> = (props) => (
  <div className="flex items-center gap-2">
    <GlobalSearch className="hidden lg:flex" />
    <HeaderPinButton {...props} />
    <ThemeToggle />
    <NotificationBell />
  </div>
);
