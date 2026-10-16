import React, { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { CircleAlert, CirclePlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ProductLookupModal from '@/features/products/ProductLookupModal';
import type { Product } from '@/features/products/types';
import { emptyRequestDrug, type StockOutRequestValues } from '../schemas';

interface RequestDrugRowsProps {
  products: Product[];
}

// Daftar obat & alkes di form permintaan (opsional, boleh kosong kalau ada jasa)
const RequestDrugRows: React.FC<RequestDrugRowsProps> = ({ products }) => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<StockOutRequestValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'drugs' });
  const drugs = useWatch({ control, name: 'drugs' });
  const [activeRow, setActiveRow] = useState<number | null>(null);

  // Pesan "minimal 1 obat atau 1 jasa" ada di root array drugs
  const generalError = errors.drugs?.root?.message ?? errors.drugs?.message;

  const handleProductSelect = (product: Product) => {
    if (activeRow === null) return;
    setValue(`drugs.${activeRow}.productName`, product.name || '');
    setValue(`drugs.${activeRow}.unit`, product.unit || 'Tablet');
    setValue(`drugs.${activeRow}.productId`, product.id, { shouldValidate: true });
    setActiveRow(null);
  };

  const generalErrorMessage = generalError && (
    <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
      <CircleAlert className="size-4" aria-hidden />
      {generalError}
    </p>
  );

  return (
    <>
      {fields.length === 0 ? (
        <>
          {generalErrorMessage}
          <Button
            type="button"
            variant="ghost"
            onClick={() => append(emptyRequestDrug())}
            className="w-full h-auto border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary hover:bg-transparent transition-all group [&_svg]:size-8"
          >
            <CirclePlus className="group-hover:scale-110 transition-transform" aria-hidden />
            <span className="font-bold text-sm">Tambah Obat / Alkes</span>
            <span className="text-xs font-normal text-slate-500">Lewati jika hanya ada jasa</span>
          </Button>
        </>
      ) : (
        <>
          {generalErrorMessage}
          <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden mb-5">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-medium border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3">
                    Nama Obat <span className="text-red-500">*</span>
                  </th>
                  <th className="px-5 py-3 w-24 text-center">
                    Jumlah <span className="text-red-500">*</span>
                  </th>
                  <th className="px-5 py-3">Satuan</th>
                  <th className="px-5 py-3 text-right">Harga</th>
                  <th className="px-5 py-3 text-right">Total Harga</th>
                  <th className="px-5 py-3 w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-card-dark">
                {fields.map((field, index) => {
                  const drug = drugs[index] ?? field;
                  const product = products.find((p) => p.id === drug.productId);
                  const price = product ? product.sellingPrice : 0;
                  const total = price * (drug.quantity || 0);
                  const drugError = errors.drugs?.[index];

                  return (
                    <tr key={field.id}>
                      <td className="px-5 py-3">
                        <div
                          className={cn(
                            'relative cursor-pointer group',
                            drugError?.productId && 'border border-red-50 rounded-lg p-1',
                          )}
                          onClick={() => setActiveRow(index)}
                        >
                          <input
                            className="w-full bg-transparent border-none font-bold text-brand-dark dark:text-white focus:ring-0 p-0 cursor-pointer placeholder-gray-400"
                            value={drug.productName || ''}
                            placeholder="Pilih Obat..."
                            aria-label="Nama obat"
                            readOnly
                          />
                          <Pencil
                            className="size-4 text-slate-400 absolute right-0 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-hidden
                          />
                        </div>
                        {drugError?.productId && (
                          <p className="text-[10px] text-red-500 mt-0.5">
                            {drugError.productId.message}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">
                          Stok: {product?.stock || 0} {drug.unit}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Input
                          type="number"
                          aria-label="Jumlah"
                          aria-invalid={!!drugError?.quantity}
                          className={cn(
                            'w-16 h-auto mx-auto rounded-lg border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark text-sm md:text-sm py-1 px-2 focus:border-primary focus-visible:ring-primary dark:text-white text-center',
                            drugError?.quantity && 'border-red-500 focus:border-red-500',
                          )}
                          {...register(`drugs.${index}.quantity`, { valueAsNumber: true })}
                        />
                        {drugError?.quantity && (
                          <p className="text-[10px] text-red-500 mt-0.5">
                            {drugError.quantity.message}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{drug.unit}</td>
                      <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">
                        Rp {price.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-slate-800 dark:text-white">
                        Rp {total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="ghost"
                          size="icon"
                          aria-label="Hapus obat"
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 h-8 w-8 rounded-lg [&_svg]:size-5"
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            onClick={() => append(emptyRequestDrug())}
            variant="ghost"
            className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl py-6 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary hover:bg-transparent transition-all group h-auto [&_svg]:size-6"
          >
            <CirclePlus className="group-hover:scale-110 transition-transform" aria-hidden />
            <span className="font-bold text-sm">Tambah Obat Lain</span>
          </Button>
        </>
      )}

      {activeRow !== null && (
        <ProductLookupModal
          products={products}
          onClose={() => setActiveRow(null)}
          onSelect={handleProductSelect}
        />
      )}
    </>
  );
};

export default RequestDrugRows;
