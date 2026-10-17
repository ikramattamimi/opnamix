import React from 'react';
import { EyeOff } from 'lucide-react';
import { OpnameItem } from '../../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StockInputs } from './useOpnameExecution';

interface StepPhysicalCountProps {
  items: OpnameItem[];
  physicalCounts: StockInputs;
  onChange: React.Dispatch<React.SetStateAction<StockInputs>>;
}

// Langkah 2: input stok fisik (blind count, stok sistem tidak ditampilkan)
const StepPhysicalCount: React.FC<StepPhysicalCountProps> = ({
  items,
  physicalCounts,
  onChange,
}) => {
  // Kosong berarti belum diisi, jadi kuncinya dihapus (bukan 0)
  const setCount = (itemId: string, val: string) => {
    if (val === '') {
      onChange((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } else {
      onChange((prev) => ({ ...prev, [itemId]: parseInt(val) }));
    }
  };

  return (
    <div className="bg-card rounded-3xl p-6 shadow-soft">
      <div className="mb-6">
        <h3 className="text-lg font-bold">Tahap 2: Input Stok Fisik</h3>
        <p className="text-sm text-muted-foreground">
          Masukkan jumlah stok fisik hasil penghitungan di gudang.
        </p>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-6 flex items-center gap-3">
        <EyeOff className="size-6 shrink-0 text-blue-500" aria-hidden />
        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Blind Count: Stok sistem disembunyikan untuk menjaga objektivitas.
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto mb-6">
        <table className="w-full text-left">
          <thead className="border-b border-gray-100 dark:border-gray-800">
            <tr className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
              <th className="px-4 py-3">Nama Produk</th>
              <th className="px-4 py-3 w-48 text-center bg-primary/5 rounded-t-xl">
                Jumlah Stok Fisik
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-4">
                  <p className="font-bold text-sm">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.category} · {item.unit}
                  </p>
                </td>
                <td className="px-4 py-4 bg-primary/5">
                  <Input
                    type="number"
                    min="0"
                    value={physicalCounts[item.id] ?? ''}
                    onChange={(e) => setCount(item.id, e.target.value)}
                    placeholder="0"
                    aria-label={`Stok fisik ${item.productName}`}
                    className="h-auto w-full bg-card border-2 border-primary/20 focus:border-primary focus-visible:ring-0 rounded-xl text-center font-bold text-lg md:text-lg py-3 shadow-sm placeholder:text-gray-300"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2 mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-background rounded-xl pt-1 pb-3 px-3 space-y-2 flex gap-2 items-center justify-between"
          >
            <div>
              <p className="font-bold text-sm">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                {item.category} · {item.unit}
              </p>
            </div>
            <div>
              <Label
                htmlFor={`fisik-${item.id}`}
                className="text-xs font-bold text-muted-foreground tracking-wider mb-1.5 block"
              >
                Stok Fisik
              </Label>
              <Input
                id={`fisik-${item.id}`}
                type="number"
                min="0"
                value={physicalCounts[item.id] ?? ''}
                onChange={(e) => setCount(item.id, e.target.value)}
                placeholder="0"
                className="h-auto w-20 text-sm bg-card border-2 border-primary/20 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md text-center font-bold px-0 py-1 shadow-sm placeholder:text-gray-300"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepPhysicalCount;
