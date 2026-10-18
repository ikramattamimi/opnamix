import React from 'react';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { isoDay, type DatePreset } from '@/hooks/dateRange';
import type { DateRangeState } from '@/hooks/useDateRange';
import { monthName } from '@/lib/format';
import { cn } from '@/lib/utils';

// Preset periode + "Atur…" untuk tanggal kustom. Varian glass untuk header.

const LABELS: Record<DatePreset, string> = {
  today: 'Hari ini',
  '7': '7 hari',
  '30': '30 hari',
  '90': '3 bln',
  '365': '12 bln',
  month: monthName(new Date().getMonth()),
  custom: 'Atur…',
};

interface DateRangeControlProps {
  state: DateRangeState;
  presets?: DatePreset[];
  variant?: 'default' | 'glass';
  className?: string;
}

export const DateRangeControl: React.FC<DateRangeControlProps> = ({
  state,
  presets = ['today', '7', '30', 'month', 'custom'],
  variant = 'default',
  className,
}) => {
  const today = isoDay(new Date());
  const inputClass = cn(
    'h-7.5 w-36 rounded-control border px-2 text-xs tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring',
    variant === 'glass'
      ? 'border-glass-line bg-glass text-on-grad [color-scheme:dark]'
      : 'border-input bg-card text-foreground',
  );
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <SegmentedControl<DatePreset>
        label="Periode"
        variant={variant}
        value={state.preset}
        onChange={state.setPreset}
        options={presets.map((p) => ({ value: p, label: LABELS[p] }))}
      />
      {state.preset === 'custom' && (
        <span
          className={cn(
            'inline-flex items-center gap-1.5',
            variant === 'glass' ? 'text-on-grad-2' : 'text-muted-foreground',
          )}
        >
          <input
            type="date"
            aria-label="Dari tanggal"
            max={today}
            value={state.custom.from}
            onChange={(e) => state.setCustom((c) => ({ ...c, from: e.target.value }))}
            className={inputClass}
          />
          –
          <input
            type="date"
            aria-label="Sampai tanggal"
            max={today}
            value={state.custom.to}
            onChange={(e) => state.setCustom((c) => ({ ...c, to: e.target.value }))}
            className={inputClass}
          />
        </span>
      )}
    </div>
  );
};
