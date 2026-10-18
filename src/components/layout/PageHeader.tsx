import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import { APP_ROUTES } from '@/app/routes';
import { getRouteTitle } from '@/app/routeUtils';
import { useStickyHeader } from '@/hooks/useStickyHeader';
import { HeaderIconButton } from './HeaderIconButton';
import { HeaderTools } from './HeaderTools';
import { StatChip, type StatChipProps } from './StatChip';
import { useShell } from './shellContext';

// Pita gradien di atas setiap halaman. Baris atas (judul + alat) selalu tampil;
// chip statistik, aksi, dan `children` (baris tambahan seperti tab) ikut
// disembunyikan saat header ringkas. Perilaku menempel/ringkas/intip/pin ada di
// useStickyHeader.

export interface PageHeaderProps {
  /** Bawaan: judul rute dari APP_ROUTES */
  title?: React.ReactNode;
  /** Tujuan tombol kembali: path, atau fungsi untuk tampilan di dalam halaman */
  back?: string | (() => void);
  stats?: (StatChipProps & { id?: string })[];
  /** Tombol aksi; pakai Button variant "light" (utama) atau "glass" */
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  back,
  stats,
  actions,
  children,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { openDrawer } = useShell();
  const { ref, pinned, togglePin, onMouseEnter, onMouseLeave, onClick } = useStickyHeader();
  const heading = title ?? getRouteTitle(pathname, APP_ROUTES);

  return (
    <header
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className="page-header sticky top-0 z-30 mb-4 flex flex-col gap-2.5 overflow-hidden rounded-2xl bg-grad-hero px-3 pb-3 pt-2.5 text-on-grad md:rounded-3xl md:px-4 md:pb-3.5 md:pt-3"
    >
      <div data-header-top="" className="flex min-h-8 items-center gap-2.5">
        <HeaderIconButton label="Buka menu" className="md:hidden" onClick={openDrawer}>
          <Menu aria-hidden />
        </HeaderIconButton>
        {back && (
          <HeaderIconButton
            label="Kembali"
            onClick={() => (typeof back === 'string' ? navigate(back) : back())}
          >
            <ArrowLeft aria-hidden />
          </HeaderIconButton>
        )}
        <h1 className="min-w-0 flex-1 text-lg font-bold leading-tight tracking-tight text-balance md:text-xl">
          {heading}
        </h1>
        <HeaderTools pinned={pinned} onTogglePin={togglePin} />
      </div>

      {(stats?.length || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {stats?.map(({ id, ...chip }) => (
              <StatChip key={id ?? chip.label} {...chip} />
            ))}
          </div>
          {actions && (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
              {actions}
            </div>
          )}
        </div>
      )}

      {children}
    </header>
  );
};
