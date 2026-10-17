import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Calendar, Tag, Truck } from 'lucide-react';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FieldErrorMessage } from '@/features/products/components/FieldErrorMessage';
import { useSupplierSuggestions } from '../useStockIn';
import type { StockInFormInput } from '../stockInSchema';

const labelClassName = 'text-sm font-bold text-foreground ml-1';
const inputClassName =
  'h-auto w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-3.5 text-sm font-medium text-foreground focus:ring-0 focus-visible:ring-0 focus:border-primary transition-all';
const inputIconClassName =
  'absolute right-4 top-3.5 size-5 text-muted-foreground pointer-events-none';

// Nomor nota, supplier, dan tanggal penerimaan
export const TransactionDetailsFields: React.FC = () => {
  const form = useFormContext<StockInFormInput>();
  const { data: supplierSuggestions = [] } = useSupplierSuggestions();

  return (
    <div>
      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">
        Detail Transaksi
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="invoiceNumber"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className={labelClassName}>Nomor Nota / Faktur</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    className={`${inputClassName} placeholder:text-muted-foreground`}
                    placeholder="Contoh: INV-2023-001"
                    type="text"
                    {...field}
                  />
                </FormControl>
                <Tag className={inputIconClassName} aria-hidden />
              </div>
              <FieldErrorMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supplierName"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className={labelClassName}>
                Nama Supplier{' '}
                <span className="text-xs font-normal text-muted-foreground">(Opsional)</span>
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    className={inputClassName}
                    placeholder="Ketik nama supplier..."
                    list="suppliers"
                    {...field}
                  />
                </FormControl>
                <datalist id="suppliers">
                  {supplierSuggestions.map((name, idx) => (
                    <option key={idx} value={name} />
                  ))}
                </datalist>
                <Truck className={inputIconClassName} aria-hidden />
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className={labelClassName}>Tanggal Penerimaan</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input className={inputClassName} type="date" {...field} />
                </FormControl>
                <Calendar className={inputIconClassName} aria-hidden />
              </div>
              <FieldErrorMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
