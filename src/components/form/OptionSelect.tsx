import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Select satu baris dari daftar pilihan. id dan aria-* diteruskan ke tombol
// pemicu, jadi bisa dipakai langsung di dalam Field atau di Toolbar.

export interface SelectOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

type TriggerAttrs = Pick<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'id' | 'aria-invalid' | 'aria-describedby' | 'aria-required' | 'aria-label' | 'disabled'
>;

export interface OptionSelectProps<T extends string> extends TriggerAttrs {
  value: T | '';
  onValueChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  placeholder?: string;
  className?: string;
}

export function OptionSelect<T extends string>({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  disabled,
  ...triggerProps
}: OptionSelectProps<T>) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as T)} disabled={disabled}>
      <SelectTrigger className={className} {...triggerProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
