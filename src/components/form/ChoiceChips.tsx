import React from 'react';
import { cn } from '@/lib/utils';

// Pilihan berbentuk chip: tunggal (value string) atau ganda (value string[])
interface Option<T extends string> {
  value: T;
  label: React.ReactNode;
}

type ChoiceChipsProps<T extends string> = {
  options: readonly Option<T>[];
  label: string;
  className?: string;
} & (
  | { multiple?: false; value: T | null; onChange: (value: T) => void }
  | { multiple: true; value: T[]; onChange: (value: T[]) => void }
);

export function ChoiceChips<T extends string>(props: ChoiceChipsProps<T>) {
  const { options, label, className } = props;
  const isOn = (v: T) => (props.multiple ? props.value.includes(v) : props.value === v);
  const toggle = (v: T) => {
    if (props.multiple) {
      props.onChange(
        props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v],
      );
    } else props.onChange(v);
  };

  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap gap-1.5', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={isOn(option.value)}
          onClick={() => toggle(option.value)}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-input bg-card px-2.5 text-note font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:font-semibold aria-pressed:text-primary-ink [&_svg]:size-3.5"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
