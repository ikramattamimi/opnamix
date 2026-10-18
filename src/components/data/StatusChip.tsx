import React from 'react';
import { cn } from '@/lib/utils';

// Chip status dengan titik. Selalu dengan teks, karena warna saja tidak cukup.
export type StatusTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

const TONES: Record<StatusTone, string> = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border',
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
