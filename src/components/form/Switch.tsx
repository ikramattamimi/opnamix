import React from 'react';
import { cn } from '@/lib/utils';

// Sakelar nyala/mati (role="switch")
interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  id,
  disabled,
  className,
}) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      'relative h-5.5 w-9.5 shrink-0 rounded-full bg-border-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-50 aria-checked:bg-primary',
      'after:absolute after:left-0.5 after:top-0.5 after:size-4.5 after:rounded-full after:bg-on-grad after:shadow after:transition-transform aria-checked:after:translate-x-4',
      className,
    )}
  />
);
