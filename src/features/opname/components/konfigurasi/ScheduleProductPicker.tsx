import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Product } from '@/features/products/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ScheduleFormValues } from './scheduleForm';

interface ScheduleProductPickerProps {
  products: Product[];
}

// Langkah 2 dialog jadwal: semua obat, atau pilih obat satu per satu
const ScheduleProductPicker: React.FC<ScheduleProductPickerProps> = ({ products }) => {
  const { control, setValue } = useFormContext<ScheduleFormValues>();
  const selectAll = useWatch({ control, name: 'selectAll' });
  const obatIds = useWatch({ control, name: 'obatIds' });
  const [search, setSearch] = useState('');
  const selected = new Set(obatIds);

  const q = search.toLowerCase();
  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q),
  );

  const setObatIds = (ids: string[]) => setValue('obatIds', ids, { shouldValidate: true });

  const toggleSelectAll = () => {
    // Memilih "Semua Obat" mengosongkan pilihan satu per satu
    if (!selectAll) setObatIds([]);
    setValue('selectAll', !selectAll, { shouldValidate: true });
  };

  const toggleObat = (id: string) => {
    if (selected.has(id)) setObatIds(obatIds.filter((x) => x !== id));
    else setObatIds([...obatIds, id]);
  };

  const toggleAllFiltered = () => {
    if (selected.size === filteredProducts.length) setObatIds([]);
    else setObatIds(filteredProducts.map((p) => p.id));
  };

  return (
    <div className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
      <div className="flex items-center justify-between bg-background-light dark:bg-background-dark rounded-xl p-3">
        <label className="flex items-center gap-3 cursor-pointer">
          {/* Belum ada komponen checkbox di components/ui */}
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-bold">Semua Obat</span>
        </label>
        <span className="text-xs text-text-secondary-light">
          {selectAll ? `${products.length} obat` : `${selected.size} dipilih`}
        </span>
      </div>

      {!selectAll && (
        <>
          <div className="relative">
            <Search
              className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light"
              aria-hidden
            />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari obat..."
              aria-label="Cari obat"
              className="h-auto w-full bg-background-light dark:bg-background-dark border-none rounded-xl pl-9 pr-4 py-2.5 text-sm md:text-sm font-medium"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary-light">
              {filteredProducts.length} obat ditemukan
            </span>
            <Button
              type="button"
              variant="link"
              onClick={toggleAllFiltered}
              className="h-auto p-0 text-xs font-bold text-primary hover:text-primary/80 hover:no-underline"
            >
              {selected.size === filteredProducts.length ? 'Batalkan Semua' : 'Pilih Semua'}
            </Button>
          </div>

          <div className="max-h-[220px] sm:max-h-[280px] overflow-y-auto space-y-1 rounded-xl border border-gray-100 dark:border-gray-800 p-2">
            {filteredProducts.map((product) => (
              <label
                key={product.id}
                className="flex items-start sm:items-center gap-3 p-3 sm:p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-white/10"
              >
                <input
                  type="checkbox"
                  checked={selected.has(product.id)}
                  onChange={() => toggleObat(product.id)}
                  className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0 mt-0.5 sm:mt-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{product.name}</p>
                  <p className="text-xs text-text-secondary-light">
                    {product.category} · {product.unit} · Stok: {product.stock}
                  </p>
                </div>
              </label>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-center text-sm text-text-secondary-light py-4 italic">
                Tidak ada obat ditemukan.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ScheduleProductPicker;
