import React, { useId } from 'react';
import { cn } from '@/lib/utils';

// Label, isian, petunjuk, dan pesan galat. Anak tunggal mendapat id, aria-invalid,
// dan aria-describedby secara otomatis. Untuk form react-hook-form tetap pakai
// FormField/FormItem dari ui/form.

interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Penanda isian wajib di label */
  required?: boolean;
  children: React.ReactElement<Record<string, unknown>>;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  hint,
  error,
  required,
  children,
  className,
}) => {
  const autoId = useId();
  const id = (children.props.id as string | undefined) ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
        {required && (
          <span className="text-bad" aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      {React.cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
};
