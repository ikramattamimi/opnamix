import React from 'react';

// 2–3 angka kecil berdampingan di dalam panel
export interface MiniStat {
  label: string;
  value: React.ReactNode;
}

export const MiniStats: React.FC<{ items: MiniStat[] }> = ({ items }) => (
  <div
    className="grid divide-x overflow-hidden rounded-xl border"
    style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
  >
    {items.map((item) => (
      <div key={item.label} className="flex min-w-0 flex-col gap-px px-2.5 py-2">
        <small className="truncate text-2xs text-muted-foreground">{item.label}</small>
        <b className="truncate text-label tabular-nums">{item.value}</b>
      </div>
    ))}
  </div>
);
