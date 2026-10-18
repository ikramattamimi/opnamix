import React from 'react';
import { cn } from '@/lib/utils';

// Kartu untuk grid (produk, jasa, pengguna, tile POS, jadwal). Slot:
// topStart/topEnd (ikon, merek, chip), title, subtitle, meter, footer.
// Dengan onClick kartu menjadi tombol; `selected` memberi garis primer.

export interface ItemCardProps {
  topStart?: React.ReactNode;
  topEnd?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meter?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** Label untuk pembaca layar bila judul saja kurang jelas */
  label?: string;
  className?: string;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  topStart,
  topEnd,
  title,
  subtitle,
  meter,
  footer,
  children,
  selected,
  disabled,
  onClick,
  label,
  className,
}) => {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      aria-pressed={onClick ? !!selected : undefined}
      aria-label={label}
      className={cn(
        'flex min-w-0 flex-col gap-1.5 rounded-xl border bg-card p-3 text-left transition-[border-color,box-shadow,transform] duration-100',
        onClick &&
          'hover:enabled:-translate-y-px hover:enabled:border-border-strong hover:enabled:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
        selected && 'border-primary ring-[3px] ring-primary-soft',
        className,
      )}
    >
      {(topStart || topEnd) && (
        <div className="flex min-h-7.5 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">{topStart}</div>
          {topEnd}
        </div>
      )}
      <div className="line-clamp-2 min-h-[2.6em] text-label font-semibold leading-snug">
        {title}
      </div>
      {subtitle && <div className="min-w-0 text-xs text-muted-foreground">{subtitle}</div>}
      {children}
      {meter}
      {footer && (
        <div className="mt-auto flex items-baseline justify-between gap-2 text-xs text-muted-foreground [&_b]:tabular-nums [&_b]:text-foreground">
          {footer}
        </div>
      )}
    </Comp>
  );
};
