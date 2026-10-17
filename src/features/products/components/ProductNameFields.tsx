import React from 'react';
import { useFormState, useWatch, type Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getProductDisplayName } from '../productDisplay';
import type { ProductFormValues } from '../productSchema';
import { FieldErrorMessage, FieldErrorText } from './FieldErrorMessage';
import { fieldErrorClassName, isFieldErrorVisible } from './fieldErrorVisibility';
import { productInputClassName, productLabelClassName } from './productFormStyles';

interface ProductNameFieldsProps {
  control: Control<ProductFormValues>;
  isMedicine: boolean;
  onFieldBlur: () => void;
}

// Non-obat mengisi nama langsung. Obat mengisi merek dan kandungan, lalu
// namanya dibentuk otomatis (error validasinya tetap di field "name").
export const ProductNameFields: React.FC<ProductNameFieldsProps> = ({
  control,
  isMedicine,
  onFieldBlur,
}) => {
  const values = useWatch({ control });
  const { errors, touchedFields, isSubmitted } = useFormState({ control });

  if (!isMedicine) {
    return (
      <FormField
        control={control}
        name="name"
        render={({ field, fieldState, formState }) => (
          <FormItem className="space-y-0">
            <FormLabel className={productLabelClassName}>
              Nama Produk <span className="text-red-600 dark:text-red-400">*</span>
            </FormLabel>
            <FormControl>
              <Input
                className={cn(
                  productInputClassName,
                  isFieldErrorVisible(fieldState, formState.isSubmitted) && fieldErrorClassName,
                )}
                placeholder="Contoh: Paracetamol 500mg"
                type="text"
                {...field}
                onBlur={() => {
                  field.onBlur();
                  onFieldBlur();
                }}
              />
            </FormControl>
            <FieldErrorMessage />
          </FormItem>
        )}
      />
    );
  }

  const nameError = errors.name?.message;
  const showNameError =
    Boolean(nameError) && (touchedFields.brand || touchedFields.composition || isSubmitted);
  const previewProductName = getProductDisplayName(values);

  return (
    <div className="grid grid-cols-2 gap-4">
      {(
        [
          { name: 'brand', label: 'Merek Obat', placeholder: 'Contoh: Sanbe, Kimia Farma...' },
          {
            name: 'composition',
            label: 'Kandungan Obat',
            placeholder: 'Contoh: Paracetamol 500mg...',
          },
        ] as const
      ).map((item) => (
        <FormField
          key={item.name}
          control={control}
          name={item.name}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className={productLabelClassName}>{item.label}</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className={productInputClassName}
                  placeholder={item.placeholder}
                  {...field}
                  onBlur={() => {
                    field.onBlur();
                    onFieldBlur();
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      ))}
      <div className="col-span-2">
        <p className="text-xs text-muted-foreground">
          Nama produk otomatis:{' '}
          <span className="font-bold text-foreground">
            {previewProductName || values.name || '-'}
          </span>
        </p>
        {showNameError && <FieldErrorText>{nameError}</FieldErrorText>}
      </div>
    </div>
  );
};
