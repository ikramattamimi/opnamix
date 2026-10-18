import React from 'react';

// Rincian jumlah + total besar
export interface TotalRow {
  label: React.ReactNode;
  value: React.ReactNode;
}

export const Totals: React.FC<{ rows?: TotalRow[]; grand: TotalRow }> = ({ rows = [], grand }) => (
  <div className="flex flex-col gap-1.5 text-meta">
    {rows.map((row, index) => (
      <div key={index} className="flex justify-between gap-3 text-muted-foreground">
        <span>{row.label}</span>
        <b className="whitespace-nowrap font-semibold tabular-nums text-foreground">{row.value}</b>
      </div>
    ))}
    <div className="mt-0.5 flex items-baseline justify-between gap-3 border-t border-dashed border-border-strong pt-2 font-semibold">
      <span>{grand.label}</span>
      <b className="whitespace-nowrap text-lg font-bold tabular-nums">{grand.value}</b>
    </div>
  </div>
);
