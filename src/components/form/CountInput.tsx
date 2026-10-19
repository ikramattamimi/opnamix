import React from 'react';
import { cn } from '@/lib/utils';

// Isian hitung fisik: angka besar + satuan. Hanya digit; kosong = belum
// dihitung (null). Enter memanggil onEnter (lompat ke isian berikutnya).

type CountInputProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  unit?: string;
  onEnter?: () => void;
};

export const CountInput = React.forwardRef<HTMLInputElement, CountInputProps>(
  ({ value, onValueChange, unit, onEnter, className, onKeyDown, ...props }, ref) => (
    <label
      className={cn(
        'flex h-9 w-32 shrink-0 items-center gap-1.5 rounded-control border border-input bg-card pr-2.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/25',
        value !== null && 'border-ok/50 bg-ok-soft',
        className,
      )}
    >
      <input
        ref={ref}
        inputMode="numeric"
        autoComplete="off"
        placeholder="—"
        value={value ?? ''}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '');
          onValueChange(digits === '' ? null : Number(digits));
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key === 'Enter' && onEnter) {
            event.preventDefault();
            onEnter();
          }
        }}
        className="h-full min-w-0 flex-1 bg-transparent pl-2.5 text-right text-base font-bold tabular-nums text-foreground outline-none placeholder:font-normal placeholder:text-faint"
        {...props}
      />
      {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
    </label>
  ),
);
CountInput.displayName = 'CountInput';
