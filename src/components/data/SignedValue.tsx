import React from 'react';
import { rpSigned, signed } from '@/lib/format';
import { cn } from '@/lib/utils';

// Angka bertanda dengan warna: kurang merah, lebih biru, nol netral.
// `currency` memformat sebagai rupiah.
export const SignedValue: React.FC<{
  value: number;
  currency?: boolean;
  /** Teks saat nilai 0, bawaan "Rp 0" / "0" */
  zero?: React.ReactNode;
  className?: string;
}> = ({ value, currency, zero, className }) => (
  <span
    className={cn('tabular-nums', value < 0 && 'text-bad', value > 0 && 'text-primary', className)}
  >
    {value === 0 && zero !== undefined ? zero : currency ? rpSigned(value) : signed(value)}
  </span>
);
