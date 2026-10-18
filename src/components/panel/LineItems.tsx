import React from 'react';
import { cn } from '@/lib/utils';

// Baris item: ikon opsional, nama, keterangan, dan jumlah di kanan
export interface LineItem {
  id: string | number;
  /** Ikon atau avatar di kiri, mis. ToneIcon size="sm" */
  lead?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  amount?: React.ReactNode;
}

export const LineItems: React.FC<{ items: LineItem[] }> = ({ items }) => (
  <div className="flex flex-col divide-y overflow-hidden rounded-xl border">
    {items.map((item) => (
      <div
        key={item.id}
        className={cn(
          'grid gap-x-2.5 gap-y-0.5 px-2.5 py-2 text-meta',
          item.lead ? 'grid-cols-[auto_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_auto]',
        )}
      >
        {item.lead && <span className="row-span-2 self-center">{item.lead}</span>}
        <span className="min-w-0">{item.title}</span>
        {item.amount !== undefined && (
          <span className="row-span-2 self-center font-semibold tabular-nums">{item.amount}</span>
        )}
        {item.subtitle && (
          <small
            className={cn(
              'text-xs text-muted-foreground',
              item.lead ? 'col-start-2' : 'col-start-1',
            )}
          >
            {item.subtitle}
          </small>
        )}
      </div>
    ))}
  </div>
);
