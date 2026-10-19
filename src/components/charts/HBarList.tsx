import React from 'react';
import { cn } from '@/lib/utils';
import { CHART_BG, type ChartColor } from './chartColors';

// Daftar batang mendatar berperingkat: nomor, nama + sub, nilai, batang.
// Lebar batang relatif terhadap nilai mutlak terbesar.

export interface HBarItem {
  id: string;
  label: React.ReactNode;
  sub?: React.ReactNode;
  value: number;
  /** Teks nilai; bawaan angka */
  display?: React.ReactNode;
  color: ChartColor;
}

export const HBarList: React.FC<{
  items: HBarItem[];
  onSelect?: (id: string) => void;
  ranked?: boolean;
  className?: string;
}> = ({ items, onSelect, ranked = true, className }) => {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {items.map((item, index) => {
        const Comp = onSelect ? 'button' : 'div';
        return (
          <Comp
            key={item.id}
            type={onSelect ? 'button' : undefined}
            onClick={onSelect ? () => onSelect(item.id) : undefined}
            className={cn(
              'grid w-full grid-cols-[auto_minmax(0,1fr)_minmax(5.5rem,40%)] items-center gap-2.5 rounded-lg px-1.5 py-1 text-left',
              onSelect &&
                'transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            {ranked ? (
              <span className="w-4 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
            ) : (
              <span />
            )}
            <span className="flex min-w-0 flex-col">
              <b className="truncate text-meta font-semibold">{item.label}</b>
              {item.sub && (
                <small className="truncate text-xs text-muted-foreground">{item.sub}</small>
              )}
            </span>
            <span className="flex min-w-0 flex-col items-end gap-1">
              <b className="text-meta font-bold tabular-nums">
                {item.display ?? item.value.toLocaleString('id-ID')}
              </b>
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <span
                  className={cn('block h-full rounded-full', CHART_BG[item.color])}
                  style={{ width: `${(Math.abs(item.value) / max) * 100}%` }}
                />
              </span>
            </span>
          </Comp>
        );
      })}
    </div>
  );
};
