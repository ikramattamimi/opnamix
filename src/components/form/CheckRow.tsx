import React, { useId } from 'react';
import { cn } from '@/lib/utils';

// Baris centang ringkas untuk daftar panjang (pilih produk opname, cakupan
// jadwal): kotak centang, judul + keterangan, dan isi di kanan.

interface CheckRowProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  disabled?: boolean;
}

export const CheckRow: React.FC<CheckRowProps> = ({
  checked,
  onCheckedChange,
  title,
  subtitle,
  trailing,
  disabled,
}) => {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2',
        checked && 'bg-primary/5',
        disabled && 'cursor-not-allowed opacity-55 hover:bg-transparent',
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="size-4 accent-primary"
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-meta font-medium">{title}</span>
        {subtitle && <small className="truncate text-xs text-muted-foreground">{subtitle}</small>}
      </span>
      {trailing}
    </label>
  );
};

// Wadah daftar CheckRow yang bisa digulir
export const CheckList: React.FC<{
  children: React.ReactNode;
  label: string;
  className?: string;
}> = ({ children, label, className }) => (
  <div
    role="group"
    aria-label={label}
    className={cn('flex max-h-80 flex-col gap-px overflow-y-auto rounded-xl border p-1', className)}
  >
    {children}
  </div>
);
