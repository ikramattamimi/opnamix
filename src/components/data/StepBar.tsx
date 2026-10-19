import React from 'react';
import { CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

// Langkah berurutan (mis. Cakupan → Hitung → Tinjau). Langkah dengan onClick
// menjadi tombol; `aside` tampil di kanan (mis. status simpan otomatis).

export interface Step {
  key: string;
  label: React.ReactNode;
  state: 'done' | 'current' | 'todo';
  onClick?: () => void;
  disabled?: boolean;
  /** Alasan langkah belum bisa dibuka (title) */
  hint?: string;
}

export const StepBar: React.FC<{ steps: Step[]; aside?: React.ReactNode; className?: string }> = ({
  steps,
  aside,
  className,
}) => (
  <nav
    aria-label="Langkah"
    className={cn(
      'flex flex-wrap items-center gap-x-2 gap-y-2 rounded-card border bg-card px-3 py-2 shadow',
      className,
    )}
  >
    <ol className="flex min-w-0 flex-wrap items-center gap-2">
      {steps.map((step, index) => {
        const content = (
          <>
            {step.state === 'done' ? (
              <CircleCheck className="size-4 text-ok" aria-hidden />
            ) : (
              <span
                className={cn(
                  'grid size-5 place-items-center rounded-full text-2xs font-bold',
                  step.state === 'current'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-2 text-muted-foreground',
                )}
              >
                {index + 1}
              </span>
            )}
            {step.label}
          </>
        );
        const cls = cn(
          'inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-meta',
          step.state === 'current' ? 'font-semibold text-foreground' : 'text-muted-foreground',
        );
        return (
          <li key={step.key} className="flex items-center gap-2">
            {index > 0 && <span className="h-px w-4 bg-border-strong" aria-hidden />}
            {step.onClick ? (
              <button
                type="button"
                onClick={step.onClick}
                disabled={step.disabled}
                title={step.disabled ? step.hint : undefined}
                aria-current={step.state === 'current' ? 'step' : undefined}
                className={cn(
                  cls,
                  'transition-colors hover:enabled:bg-surface-2 hover:enabled:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
                )}
              >
                {content}
              </button>
            ) : (
              <span aria-current={step.state === 'current' ? 'step' : undefined} className={cls}>
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ol>
    {aside && (
      <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
        {aside}
      </span>
    )}
  </nav>
);
