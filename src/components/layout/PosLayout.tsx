import React, { useCallback, useMemo, useState } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KeyboardHints } from '@/components/data/Kbd';
import { PanelContext } from '@/components/panel/panelContext';
import { Totals, type TotalsProps } from '@/components/panel/Totals';
import { useEscapeKey, useFitToViewport } from '@/hooks/useFitToViewport';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useShell } from './shellContext';

// Layar kerja ala kasir: katalog di kiri, keranjang di kanan yang menempel di
// bawah header halaman. Di bawah 1024px keranjang menjadi sheet dari bawah,
// dibuka lewat CartBar yang menempel di bawah layar. Isi keranjang biasanya
// SidePanel; tombol tutupnya muncul otomatis saat tampil sebagai sheet.
// Dipakai POS Stok Keluar, POS Stok Masuk, dan layar kerja opname.

export const POS_SHEET_QUERY = '(max-width: 1024px)';

export interface CartBarProps {
  /** Teks kecil di atas nilai, mis. "3 item" */
  summary: React.ReactNode;
  value: React.ReactNode;
  actionLabel: string;
  icon?: LucideIcon;
  onOpen: () => void;
  className?: string;
}

// Bilah ringkas di bawah layar sempit: ringkasan + tombol membuka keranjang
export const CartBar: React.FC<CartBarProps> = ({
  summary,
  value,
  actionLabel,
  icon: Icon,
  onOpen,
  className,
}) => (
  <div
    className={cn(
      'flex items-center gap-3 border-t bg-card px-4 pt-2.5 shadow-float',
      'pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]',
      className,
    )}
  >
    <span className="flex min-w-0 flex-1 flex-col leading-tight">
      <small className="truncate text-xs text-muted-foreground">{summary}</small>
      <b className="truncate text-panel font-bold tabular-nums">{value}</b>
    </span>
    <Button onClick={onOpen}>
      {Icon && <Icon aria-hidden />}
      {actionLabel}
    </Button>
  </div>
);

interface PosCartFooterProps {
  totals: TotalsProps;
  submitLabel: string;
  submitIcon?: LucideIcon;
  onSubmit: () => void;
  onClear: () => void;
  /** Keranjang kosong: tombol dimatikan */
  disabled?: boolean;
  busy?: boolean;
}

// Kaki keranjang: total, Kosongkan + tombol utama, dan petunjuk pintasan.
// Pakai sebagai `footer` SidePanel di dalam PosLayout.
export const PosCartFooter: React.FC<PosCartFooterProps> = ({
  totals,
  submitLabel,
  submitIcon: Icon,
  onSubmit,
  onClear,
  disabled,
  busy,
}) => (
  <div className="flex w-full flex-col gap-2.5">
    <Totals {...totals} />
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
      <Button variant="ghost" onClick={onClear} disabled={disabled || busy}>
        Kosongkan
      </Button>
      <Button size="lg" onClick={onSubmit} disabled={disabled || busy}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : Icon && <Icon aria-hidden />}
        {submitLabel}
      </Button>
    </div>
    <KeyboardHints
      hints={[
        { keys: '/', label: 'cari' },
        { keys: 'Enter', label: 'tambah hasil teratas' },
      ]}
    />
  </div>
);

interface PosLayoutProps {
  catalog: React.ReactNode;
  cart: React.ReactNode;
  /** Isi CartBar di layar sempit (tanpa onOpen) */
  bar: Omit<CartBarProps, 'onOpen' | 'className'>;
  /** Label keranjang untuk pembaca layar */
  cartLabel: string;
  className?: string;
}

export const PosLayout: React.FC<PosLayoutProps> = ({
  catalog,
  cart,
  bar,
  cartLabel,
  className,
}) => {
  const isSheet = useMediaQuery(POS_SHEET_QUERY);
  const { sidebarPinned } = useShell();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const context = useMemo(() => ({ isDrawer: isSheet, close }), [isSheet, close]);
  const sheetOpen = isSheet && open;
  const stickyRef = useFitToViewport<HTMLElement>(!isSheet);
  useEscapeKey(sheetOpen, close);

  return (
    <div
      className={cn(
        'grid items-start gap-3',
        isSheet ? 'pb-16' : 'grid-cols-[minmax(0,1fr)_24rem]',
        className,
      )}
    >
      <div className="min-w-0">{catalog}</div>
      <PanelContext.Provider value={context}>
        {isSheet ? (
          <>
            <div
              className={cn(
                'fixed inset-0 z-[55] bg-scrim transition-opacity duration-200',
                sheetOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              onClick={close}
              aria-hidden
            />
            <aside
              role="dialog"
              aria-modal={sheetOpen}
              aria-hidden={!sheetOpen}
              aria-label={cartLabel}
              className={cn(
                'fixed inset-x-0 bottom-0 z-[60] flex max-h-[86dvh] flex-col transition-[transform,visibility] duration-200 ease-out',
                '[&>section]:max-h-[86dvh] [&>section]:rounded-b-none [&>section]:border-x-0 [&>section]:border-b-0',
                '[&>section]:pb-[env(safe-area-inset-bottom,0px)]',
                sheetOpen ? 'translate-y-0 shadow-float' : 'invisible translate-y-[105%]',
              )}
            >
              {cart}
            </aside>
            <CartBar
              {...bar}
              onOpen={() => setOpen(true)}
              className={cn(
                'fixed bottom-0 left-0 right-0 z-30',
                sidebarPinned ? 'md:left-sbw' : 'md:left-rail',
              )}
            />
          </>
        ) : (
          <aside
            ref={stickyRef}
            aria-label={cartLabel}
            className="sticky top-below-header flex min-h-0 flex-col"
          >
            {cart}
          </aside>
        )}
      </PanelContext.Provider>
    </div>
  );
};
