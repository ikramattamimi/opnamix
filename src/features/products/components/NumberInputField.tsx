import React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn, sanitizePriceInput } from '@/lib/utils';
import { FieldErrorMessage } from './FieldErrorMessage';
import { fieldErrorClassName, isFieldErrorVisible } from './fieldErrorVisibility';

interface NumberInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: React.ReactNode;
  labelClassName: string;
  inputClassName: string;
  placeholder?: string;
  // Teks di dalam input sebelah kiri, misalnya "Rp"
  prefix?: string;
  className?: string;
  onBlur?: () => void;
}

// Input angka bulat non-negatif. Isi kosong disimpan sebagai undefined.
export function NumberInputField<T extends FieldValues>({
  control,
  name,
  label,
  labelClassName,
  inputClassName,
  placeholder = '0',
  prefix,
  className,
  onBlur,
}: NumberInputFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState, formState }) => {
        const input = (
          <FormControl>
            <Input
              ref={field.ref}
              name={field.name}
              className={cn(
                inputClassName,
                isFieldErrorVisible(fieldState, formState.isSubmitted) && fieldErrorClassName,
              )}
              placeholder={placeholder}
              type="number"
              min="0"
              value={field.value ?? ''}
              onChange={(e) => {
                const sanitized = sanitizePriceInput(e.target.value);
                field.onChange(sanitized === '' ? undefined : Number(sanitized));
              }}
              onBlur={() => {
                field.onBlur();
                onBlur?.();
              }}
            />
          </FormControl>
        );

        return (
          <FormItem className={cn('space-y-0', className)}>
            <FormLabel className={labelClassName}>{label}</FormLabel>
            {prefix ? (
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-text-secondary-light text-sm">
                  {prefix}
                </span>
                {input}
              </div>
            ) : (
              input
            )}
            <FieldErrorMessage />
          </FormItem>
        );
      }}
    />
  );
}
