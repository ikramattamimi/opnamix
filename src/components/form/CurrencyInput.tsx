import React from 'react';
import { cn } from '@/lib/utils';
import { formatThousands, parseDigits } from './number';

// Isian rupiah dengan awalan "Rp" dan titik ribuan. Nilai keluar berupa angka
// (atau null kalau kosong).

type CurrencyInputProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
};

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, className, ...props }, ref) => (
    <div className="relative">
      <span
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
        aria-hidden
      >
        Rp
      </span>
      <input
        ref={ref}
        inputMode="numeric"
        autoComplete="off"
        value={value === null ? '' : formatThousands(value)}
        onChange={(event) => onValueChange(parseDigits(event.target.value))}
        className={cn(
          'flex h-8 w-full rounded-control border border-input bg-card pl-7.5 pr-2.5 text-meta tabular-nums text-foreground placeholder:text-faint focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50 aria-[invalid=true]:border-bad',
          className,
        )}
        {...props}
      />
    </div>
  ),
);
CurrencyInput.displayName = 'CurrencyInput';
