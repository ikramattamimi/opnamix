import React from 'react';
import { cn } from '@/lib/utils';

// Tombol papan ketik dan baris petunjuk pintasan ("/ cari · Enter tambah")

export const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <kbd
    className={cn(
      'rounded-md border bg-surface-2 px-1.5 font-mono text-2xs text-muted-foreground',
      className,
    )}
  >
    {children}
  </kbd>
);

export interface KeyHint {
  keys: string;
  label: string;
}

export const KeyboardHints: React.FC<{ hints: KeyHint[]; className?: string }> = ({
  hints,
  className,
}) => (
  // Pintasan hanya berguna dengan papan ketik, jadi disembunyikan di layar sentuh kecil
  <p className={cn('hidden flex-wrap gap-x-3 gap-y-1 text-xs text-faint sm:flex', className)}>
    {hints.map((hint) => (
      <span key={hint.keys} className="inline-flex items-center gap-1">
        <Kbd>{hint.keys}</Kbd>
        {hint.label}
      </span>
    ))}
  </p>
);
