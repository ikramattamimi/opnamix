import React from 'react';

// Baris item: nama, keterangan, dan jumlah di kanan
export interface LineItem {
  id: string | number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  amount?: React.ReactNode;
}

export const LineItems: React.FC<{ items: LineItem[] }> = ({ items }) => (
  <div className="flex flex-col divide-y overflow-hidden rounded-xl border">
    {items.map((item) => (
      <div
        key={item.id}
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 gap-y-0.5 px-2.5 py-2 text-meta"
      >
        <span className="min-w-0">{item.title}</span>
        {item.amount !== undefined && (
          <span className="row-span-2 self-center font-semibold tabular-nums">{item.amount}</span>
        )}
        {item.subtitle && (
          <small className="col-start-1 text-xs text-muted-foreground">{item.subtitle}</small>
        )}
      </div>
    ))}
  </div>
);
