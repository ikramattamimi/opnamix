import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Product } from '@/features/products/types';
import { FieldErrorMessage } from '@/features/products/components/FieldErrorMessage';
import type { StockInFormInput } from '../stockInSchema';

const labelClassName = 'text-sm font-bold text-text-primary-light dark:text-white ml-1';

interface StockInItemCardProps {
  index: number;
  products: Product[];
  canRemove: boolean;
  onRemove: () => void;
  onOpenLookup: () => void;
}

export const StockInItemCard: React.FC<StockInItemCardProps> = ({
  index,
  products,
  canRemove,
  onRemove,
  onOpenLookup,
}) => {
  const { control } = useFormContext<StockInFormInput>();

  return (
    <div className="bg-background-light dark:bg-background-dark rounded-2xl p-6 relative">
      {canRemove && (
        <Button
          type="button"
          onClick={onRemove}
          variant="destructive"
          size="icon"
          aria-label="Hapus item"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg [&_svg]:size-3"
        >
          <X aria-hidden />
        </Button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FormField
          control={control}
          name={`items.${index}.productId`}
          render={({ field }) => {
            const productName = field.value
              ? products.find((p) => p.id === field.value)?.name || 'Produk Terpilih'
              : 'Cari Obat / Alkes...';
            return (
              <FormItem className="md:col-span-2 space-y-2">
                <FormLabel className={labelClassName}>Pilih Produk</FormLabel>
                <FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onOpenLookup}
                    className={cn(
                      'group h-auto w-full bg-white dark:bg-card-dark hover:bg-white dark:hover:bg-card-dark border-none rounded-2xl px-4 py-3.5 text-sm font-medium shadow-sm transition-all flex items-center justify-between active:scale-100 [&_svg]:size-6',
                      field.value
                        ? 'text-text-primary-light dark:text-white hover:text-text-primary-light'
                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-secondary-light',
                    )}
                  >
                    <span>{productName}</span>
                    <Search
                      className="text-primary group-hover:scale-110 transition-transform"
                      aria-hidden
                    />
                  </Button>
                </FormControl>
                <FieldErrorMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={control}
          name={`items.${index}.expiryDate`}
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className={labelClassName}>Tanggal Kedaluwarsa</FormLabel>
              <FormControl>
                <Input
                  className="h-auto w-full bg-white dark:bg-card-dark border-none rounded-2xl px-4 py-3.5 text-sm font-medium text-text-primary-light dark:text-white shadow-sm focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary/20"
                  type="date"
                  {...field}
                />
              </FormControl>
              <FieldErrorMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className={labelClassName}>Jumlah</FormLabel>
              <div className="flex items-center bg-white dark:bg-card-dark rounded-2xl p-1 shadow-sm">
                <FormControl>
                  <Input
                    ref={field.ref}
                    name={field.name}
                    className="h-auto flex-1 w-full border-none bg-transparent text-center text-sm font-bold text-text-primary-light dark:text-white shadow-none focus:ring-0 focus-visible:ring-0 p-0"
                    type="number"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                    onBlur={field.onBlur}
                  />
                </FormControl>
              </div>
              <FieldErrorMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
