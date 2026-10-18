import React from 'react';
import { cn } from '@/lib/utils';

// Chip kaca di header halaman: angka ringkas statis, atau tombol filter
// (`onClick` + `pressed`). Titik berwarna opsional untuk status.

export type StatTone = 'ok' | 'warn' | 'bad';

export interface StatChipProps {
  label: string;
  value: React.ReactNode;
  tone?: StatTone;
  /** Kalau diisi, chip menjadi tombol filter */
  onClick?: () => void;
  pressed?: boolean;
}

const DOT: Record<StatTone, string> = {
  ok: 'bg-dot-ok',
  warn: 'bg-dot-warn',
  bad: 'bg-dot-bad',
};

const BASE =
  'group inline-flex h-6.5 items-center gap-1.5 whitespace-nowrap rounded-full border border-glass-line bg-glass px-2.5 text-xs text-on-grad-2';

export const StatChip: React.FC<StatChipProps> = ({ label, value, tone, onClick, pressed }) => {
  const content = (
    <>
      {tone && <span className={cn('size-1.5 rounded-full', DOT[tone])} aria-hidden />}
      <span>{label}</span>
      <b className="font-bold tabular-nums text-on-grad group-aria-pressed:text-grad-ink">
        {value}
      </b>
    </>
  );

  if (!onClick) return <span className={BASE}>{content}</span>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!pressed}
      className={cn(
        BASE,
        'transition-colors hover:bg-glass-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-grad',
        'aria-pressed:border-on-grad aria-pressed:bg-on-grad aria-pressed:text-grad-ink',
      )}
    >
      {content}
    </button>
  );
};
