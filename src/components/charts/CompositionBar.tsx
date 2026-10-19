import React from 'react';
import { cn } from '@/lib/utils';
import { CHART_BG, type ChartColor } from './chartColors';

// Batang bertumpuk 100% + legenda dengan jumlah dan nilai per bagian
export interface CompositionPart {
  key: string;
  label: string;
  count: number;
  color: ChartColor;
  /** Nilai di kanan legenda, mis. rupiah */
  value?: React.ReactNode;
}

export const CompositionBar: React.FC<{
  parts: CompositionPart[];
  label: string;
  /** Akhiran jumlah di legenda, mis. "×" */
  countSuffix?: string;
  className?: string;
}> = ({ parts, label, countSuffix = '×', className }) => {
  const total = parts.reduce((sum, p) => sum + p.count, 0);
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div
        role="img"
        aria-label={`${label}: ${parts.map((p) => `${p.label} ${p.count}`).join(', ')}`}
        className="flex h-3 gap-0.5 overflow-hidden rounded-full"
      >
        {parts.map((p) => (
          <span
            key={p.key}
            title={`${p.label}: ${p.count}`}
            className={cn('h-full first:rounded-l-full last:rounded-r-full', CHART_BG[p.color])}
            style={{ flex: total ? p.count : 1 }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {parts.map((p) => (
          <div
            key={p.key}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 text-meta"
          >
            <i className={cn('size-2 rounded-sm', CHART_BG[p.color])} aria-hidden />
            <span className="truncate">{p.label}</span>
            <small className="text-xs tabular-nums text-muted-foreground">
              {p.count}
              {countSuffix}
            </small>
            <b className="text-right font-semibold tabular-nums">{p.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
};
