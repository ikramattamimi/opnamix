import React from 'react';
import { cn } from '@/lib/utils';

// Chip status dengan titik. Selalu dengan teks, karena warna saja tidak cukup.
// Nada kategori (obat/bhp/imun/alkes) untuk label seperti role, biasanya dengan `plain`.
export type StatusTone =
  'ok' | 'warn' | 'bad' | 'info' | 'neutral' | 'obat' | 'bhp' | 'imun' | 'alkes';

const TONES: Record<StatusTone, string> = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border',
  obat: 'bg-cat-obat/15 text-cat-obat',
  bhp: 'bg-cat-bhp/15 text-cat-bhp',
  imun: 'bg-cat-imun/15 text-cat-imun',
  alkes: 'bg-cat-alkes/15 text-cat-alkes',
};

export const StatusChip: React.FC<{
  tone: StatusTone;
  children: React.ReactNode;
  /** Tanpa titik, mis. untuk label role */
  plain?: boolean;
  className?: string;
}> = ({ tone, children, plain, className }) => (
  <span
    className={cn(
      'inline-flex h-5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-2xs font-semibold [&_svg]:size-3',
      TONES[tone],
      className,
    )}
  >
    {!plain && tone !== 'neutral' && (
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
    )}
    {children}
  </span>
);
