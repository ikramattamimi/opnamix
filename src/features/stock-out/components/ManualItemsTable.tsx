import React, { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ProductLookupModal from '@/features/products/ProductLookupModal';
import type { Product } from '@/features/products/types';
import { useProducts } from '@/features/products/useProducts';
import { emptyManualItem, type StockOutManualValues } from '../schemas';

const TH = 'px-4 py-3 text-xs font-bold text-muted-foreground dark:text-gray-400 uppercase';

// Tabel item obat di form stok keluar manual (baris bisa ditambah, dihapus, dan dipilih produknya)
const ManualItemsTable: React.FC = () => {
  const { data: productData } = useProducts({ page: 1, perPage: 1000 });
  const products = productData?.data || [];

  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<StockOutManualValues>();
  const { fields, append, remove, update } = useFieldArray({ control, name: 'items' });
  const items = useWatch({ control, name: 'items' });
  const [activeRow, setActiveRow] = useState<number | null>(null);

  // Baris terakhir tidak dihapus, hanya dikosongkan
  const handleRemove = (index: number) => {
    if (fields.length > 1) remove(index);
    else update(0, emptyManualItem());
  };

  const handleProductSelect = (product: Product) => {
    if (activeRow === null) return;
    setValue(`items.${activeRow}.productName`, product.name);
    setValue(`items.${activeRow}.unit`, product.unit);
    setValue(`items.${activeRow}.productId`, product.id, { shouldValidate: true });
    setActiveRow(null);
  };

  return (
    <div className="bg-white dark:bg-background/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
          <tr>
            <th className={cn(TH, 'text-left')}>
              Nama Obat <span className="text-red-500">*</span>
            </th>
            <th className={cn(TH, 'text-center w-24')}>
              Jml <span className="text-red-500">*</span>
            </th>
            <th className={cn(TH, 'text-center w-24')}>Satuan</th>
            <th className={cn(TH, 'text-right')}>Harga</th>
            <th className={cn(TH, 'text-right')}>Total</th>
            <th className="px-4 py-3 text-center w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {fields.map((field, index) => {
            const item = items[index] ?? field;
            const product = products.find((p) => p.id === item.productId);
            const price = product ? product.sellingPrice : 0;
            const total = price * (item.quantity || 0);
            const itemError = errors.items?.[index];

            return (
              <tr
                key={field.id}
                className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setActiveRow(index)}
                      className={cn(
                        'w-full text-left cursor-pointer px-3 py-2 rounded-xl border border-transparent hover:border-primary/30 hover:bg-white dark:hover:bg-black/20 transition-all flex items-center justify-between',
                        item.productId
                          ? 'font-bold text-foreground'
                          : 'text-muted-foreground italic bg-gray-50/50 dark:bg-white/5',
                        itemError?.productId && 'border-red-500 bg-red-50/50',
                      )}
                    >
                      <span className="truncate max-w-[200px]">
                        {item.productName || 'Pilih Obat...'}
                      </span>
                      <Search
                        className="size-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-hidden
                      />
                    </button>
                    {itemError?.productId && (
                      <span className="text-[10px] text-red-500 mt-1 ml-1">
                        {itemError.productId.message}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <div className="flex flex-col items-center">
                    <Input
                      type="number"
                      min="1"
                      aria-label="Jumlah"
                      aria-invalid={!!itemError?.quantity}
                      className={cn(
                        'w-full bg-transparent border border-transparent shadow-none hover:border-gray-200 dark:hover:border-white/10 focus:border-primary focus-visible:ring-0 text-center font-bold text-sm md:text-sm px-1',
                        itemError?.quantity && 'border-red-500',
                      )}
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                    {itemError?.quantity && (
                      <span className="text-[10px] text-red-500 mt-1 text-center">
                        {itemError.quantity.message}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-center text-muted-foreground dark:text-gray-400">
                  {item.unit || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right text-muted-foreground dark:text-gray-400">
                  {price > 0 ? `Rp ${price.toLocaleString('id-ID')}` : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-foreground">
                  {total > 0 ? `Rp ${total.toLocaleString('id-ID')}` : '-'}
                </td>
                <td className="px-2 py-3 text-center">
                  <Button
                    type="button"
                    onClick={() => handleRemove(index)}
                    variant="ghost"
                    size="icon-sm"
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 [&_svg]:size-5"
                    title="Hapus Baris"
                    aria-label="Hapus Baris"
                  >
                    <X aria-hidden />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Button
        type="button"
        onClick={() => append(emptyManualItem())}
        variant="ghost"
        className="w-full text-sm font-bold text-primary hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-center gap-2 border-t border-dashed border-gray-200 dark:border-white/10 rounded-t-none [&_svg]:size-5"
      >
        <Plus aria-hidden />
        Tambah Baris Baru
      </Button>

      {activeRow !== null && (
        <ProductLookupModal
          products={products}
          onClose={() => setActiveRow(null)}
          onSelect={handleProductSelect}
          allowAddProduct={false}
        />
      )}
    </div>
  );
};

export default ManualItemsTable;
