import React from 'react';
import { cn } from '@/lib/utils';

// Batang kecil untuk sisa stok atau progres. Warna mengikuti tone.
export const Meter: React.FC<{
  /** 0–1 */
  value: number;
  tone?: 'ok' | 'warn' | 'bad' | 'primary';
  label?: string;
  className?: string;
}> = ({ value, tone = 'ok', label, className }) => {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
      className={cn(
        'h-1 overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-border',
        className,
      )}
    >
      <span
        className={cn(
          'block h-full rounded-full',
          { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', primary: 'bg-primary' }[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};
