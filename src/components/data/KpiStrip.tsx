import React from 'react';
import { cn } from '@/lib/utils';

// Deretan angka ringkas: label (opsional dengan kotak warna), nilai, keterangan
export interface Kpi {
  label: React.ReactNode;
  value: React.ReactNode;
  note?: React.ReactNode;
  /** Kelas latar kotak warna kecil, mis. "bg-chart-minus" */
  swatch?: string;
}

export const KpiStrip: React.FC<{ items: Kpi[]; className?: string }> = ({ items, className }) => (
  <div className={cn('grid grid-cols-[repeat(auto-fit,minmax(8.125rem,1fr))] gap-2', className)}>
    {items.map((item, index) => (
      <div key={index} className="flex min-w-0 flex-col gap-px rounded-xl bg-surface-2 px-3 py-2">
        <small className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {item.swatch && (
            <i className={cn('size-2 shrink-0 rounded-sm', item.swatch)} aria-hidden />
          )}
          {item.label}
        </small>
        <b className="truncate text-lg font-bold tabular-nums">{item.value}</b>
        {item.note && <em className="text-xs not-italic text-muted-foreground">{item.note}</em>}
      </div>
    ))}
  </div>
);
