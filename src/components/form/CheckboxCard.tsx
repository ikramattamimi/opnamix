import React, { useId } from 'react';
import { cn } from '@/lib/utils';

// Kotak centang berbentuk kartu: judul + keterangan (mis. role pengguna)
interface CheckboxCardProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const CheckboxCard: React.FC<CheckboxCardProps> = ({
  checked,
  onCheckedChange,
  title,
  description,
  icon,
  disabled,
}) => {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'grid cursor-pointer grid-cols-[auto_1fr] items-start gap-2.5 rounded-xl border px-2.5 py-2 transition-colors hover:border-border-strong',
        checked && 'border-primary/55 bg-primary/5',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-label font-semibold">
          {icon}
          {title}
        </span>
        {description && (
          <small className="mt-1 block text-xs leading-snug text-muted-foreground">
            {description}
          </small>
        )}
      </span>
    </label>
  );
};
