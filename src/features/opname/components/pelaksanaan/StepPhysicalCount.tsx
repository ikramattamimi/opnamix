import React from 'react';
import { EyeOff } from 'lucide-react';
import { OpnameItem } from '../../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StockInputs } from './useOpnameExecution';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

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
    <Card className="p-6">
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
        <Table>
          <TableHeader>
            <TableRow className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
              <TableHead>Nama Produk</TableHead>
              <TableHead className="w-48 text-center rounded-t-xl">Jumlah Stok Fisik</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <p className="font-bold text-sm">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.category} · {item.unit}
                  </p>
                </TableCell>
                <TableCell className="bg-primary/5">
                  <Input
                    type="number"
                    min="0"
                    value={physicalCounts[item.id] ?? ''}
                    onChange={(e) => setCount(item.id, e.target.value)}
                    placeholder="0"
                    aria-label={`Stok fisik ${item.productName}`}
                    className="w-full bg-card border-2 border-primary/20 focus:border-primary focus-visible:ring-0 text-center font-bold text-lg md:text-lg shadow-sm placeholder:text-gray-300"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                className="w-20 text-sm bg-card border-2 border-primary/20 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-center font-bold px-0 shadow-sm placeholder:text-gray-300"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default StepPhysicalCount;
