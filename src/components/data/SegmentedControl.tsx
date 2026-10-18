import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Pilihan tunggal bersegmen, opsional dengan hitungan per pilihan.
// Varian `glass` untuk dipakai di atas gradien (header, sidebar).

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  count?: number;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  variant?: 'default' | 'glass';
  /** Lebar penuh, segmen dibagi rata */
  full?: boolean;
  className?: string;
}

const groupVariants = cva('gap-0.5 rounded-xl p-0.5', {
  variants: {
    variant: {
      default: 'border bg-surface-2',
      glass: 'bg-glass-shade',
    },
    full: {
      true: 'grid auto-cols-fr grid-flow-col',
      false: 'inline-flex max-w-full overflow-x-auto',
    },
  },
});

const itemVariants = cva(
  'inline-flex h-6.5 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-meta font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'text-muted-foreground hover:text-foreground aria-pressed:bg-card aria-pressed:font-semibold aria-pressed:text-foreground aria-pressed:shadow',
        glass:
          'text-xs text-on-grad-2 hover:text-on-grad aria-pressed:bg-glass-2 aria-pressed:text-on-grad',
      },
    },
  },
);

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  variant = 'default',
  full = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(groupVariants({ variant, full }), className)}
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={itemVariants({ variant })}
          >
            {Icon && <Icon aria-hidden />}
            {option.label}
            {option.count !== undefined && (
              <em
                className={cn(
                  'not-italic tabular-nums',
                  variant === 'glass' ? 'text-on-grad-3' : 'text-2xs text-muted-foreground',
                )}
              >
                {option.count}
              </em>
            )}
          </button>
        );
      })}
    </div>
  );
}
