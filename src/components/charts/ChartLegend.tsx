import React from 'react';
import { cn } from '@/lib/utils';
import { CHART_BG, type ChartColor } from './chartColors';

// Keterangan warna seri grafik
export interface LegendItem {
  label: React.ReactNode;
  color: ChartColor;
}

export const ChartLegend: React.FC<{ items: LegendItem[]; className?: string }> = ({
  items,
  className,
}) => (
  <span className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs', className)}>
    {items.map((item, index) => (
      <span key={index} className="inline-flex items-center gap-1.5 text-muted-foreground">
        <i className={cn('size-2 shrink-0 rounded-sm', CHART_BG[item.color])} aria-hidden />
        {item.label}
      </span>
    ))}
  </span>
);
