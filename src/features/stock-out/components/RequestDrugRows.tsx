import React, { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { CircleAlert, CirclePlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ProductLookupModal from '@/features/products/ProductLookupModal';
import type { Product } from '@/features/products/types';
import { emptyRequestDrug, type StockOutRequestValues } from '../schemas';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

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
            size="lg"
            onClick={() => append(emptyRequestDrug())}
            className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary hover:bg-transparent transition-all group [&_svg]:size-6"
          >
            <CirclePlus className="group-hover:scale-110 transition-transform" aria-hidden />
            <span className="font-bold text-sm">Tambah Obat / Alkes</span>
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Lewati jika hanya ada jasa
          </p>
        </>
      ) : (
        <>
          {generalErrorMessage}
          <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden mb-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Nama Obat <span className="text-red-600 dark:text-red-400">*</span>
                  </TableHead>
                  <TableHead className="w-24 text-center">
                    Jumlah <span className="text-red-600 dark:text-red-400">*</span>
                  </TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Total Harga</TableHead>
                  <TableHead className="w-16 text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-card">
                {fields.map((field, index) => {
                  const drug = drugs[index] ?? field;
                  const product = products.find((p) => p.id === drug.productId);
                  const price = product ? product.sellingPrice : 0;
                  const total = price * (drug.quantity || 0);
                  const drugError = errors.drugs?.[index];

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div
                          className={cn(
                            'relative cursor-pointer group',
                            drugError?.productId && 'border border-red-50 rounded-lg p-1',
                          )}
                          onClick={() => setActiveRow(index)}
                        >
                          <input
                            className="w-full bg-transparent border-none font-bold text-foreground focus:ring-0 p-0 cursor-pointer placeholder-gray-400"
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
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          aria-label="Jumlah"
                          aria-invalid={!!drugError?.quantity}
                          className={cn(
                            'w-16 mx-auto border-gray-200 dark:border-gray-700 bg-background text-sm md:text-sm px-2 focus:border-primary focus-visible:ring-primary dark:text-white text-center',
                            drugError?.quantity && 'border-red-500 focus:border-red-500',
                          )}
                          {...register(`drugs.${index}.quantity`, { valueAsNumber: true })}
                        />
                        {drugError?.quantity && (
                          <p className="text-[10px] text-red-500 mt-0.5">
                            {drugError.quantity.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        {drug.unit}
                      </TableCell>
                      <TableCell className="text-right text-slate-600 dark:text-slate-300">
                        Rp {price.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-800 dark:text-white">
                        Rp {total.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Hapus obat"
                          className="text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 [&_svg]:size-5"
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Button
            type="button"
            onClick={() => append(emptyRequestDrug())}
            variant="ghost"
            className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary hover:bg-transparent transition-all group [&_svg]:size-6"
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
