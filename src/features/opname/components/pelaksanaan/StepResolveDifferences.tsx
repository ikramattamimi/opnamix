import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { OpnameItem } from '../../types';
import { calculateOpnameDifference } from '../../opnameCalc';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

interface StepResolveDifferencesProps {
  items: OpnameItem[];
  physicalCounts: StockInputs;
  finalStocks: StockInputs;
  onFinalStocksChange: React.Dispatch<React.SetStateAction<StockInputs>>;
  reasons: Record<string, string>;
  onReasonsChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const formatDiff = (diff: number) => (diff > 0 ? `+${diff}` : diff);

const RequiredMark: React.FC<{ className: string }> = ({ className }) => (
  <span
    className={cn(
      'absolute right-2 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded uppercase',
      className,
    )}
  >
    Wajib
  </span>
);

const MatchedMark: React.FC = () => (
  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
    <BadgeCheck className="size-3" aria-hidden /> Sesuai
  </span>
);

// Langkah 3: review selisih, tentukan stok final, dan isi alasan perbedaan
const StepResolveDifferences: React.FC<StepResolveDifferencesProps> = ({
  items,
  physicalCounts,
  finalStocks,
  onFinalStocksChange,
  reasons,
  onReasonsChange,
}) => {
  // Stok final yang belum diubah mengikuti stok fisik
  const finalValue = (itemId: string) =>
    itemId in finalStocks ? (finalStocks[itemId] ?? '') : (physicalCounts[itemId] ?? '');
  const setFinal = (itemId: string, val: string) =>
    onFinalStocksChange((prev) => ({ ...prev, [itemId]: val === '' ? undefined : parseInt(val) }));
  const setReason = (itemId: string, val: string) =>
    onReasonsChange((prev) => ({ ...prev, [itemId]: val }));

  const rows = items.map((item) => {
    const physical = physicalCounts[item.id] || 0;
    const diff = calculateOpnameDifference(physical, item.systemStock);
    return { item, physical, diff, hasDiff: diff !== 0 };
  });

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold">Tahap 3: Penyesuaian Stok</h3>
        <p className="text-sm text-muted-foreground">
          Review selisih dan tentukan stok final. Alasan wajib diisi jika ada selisih.
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto mb-6">
        <Table>
          <TableHeader>
            <TableRow className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
              <TableHead>Nama Produk</TableHead>
              <TableHead className="text-center">Stok Sistem</TableHead>
              <TableHead className="text-center">Stok Fisik</TableHead>
              <TableHead className="text-center">Selisih</TableHead>
              <TableHead className="text-center w-32">Stok Final</TableHead>
              <TableHead className="w-64">Alasan Perbedaan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ item, physical, diff, hasDiff }) => (
              <TableRow
                key={item.id}
                className={cn('transition-colors', hasDiff && 'bg-amber-500/[0.03]')}
              >
                <TableCell>
                  <p className="font-bold text-sm">{item.productName}</p>
                </TableCell>
                <TableCell className="text-center font-medium text-muted-foreground">
                  {item.systemStock}
                </TableCell>
                <TableCell className="text-center font-bold text-primary">{physical}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={diff > 0 ? 'success' : diff < 0 ? 'danger' : 'neutral'}>
                    {formatDiff(diff)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={finalValue(item.id)}
                    onChange={(e) => setFinal(item.id, e.target.value)}
                    aria-label={`Stok final ${item.productName}`}
                    className="w-full bg-background border-none px-3 text-center text-sm md:text-sm font-bold"
                  />
                </TableCell>
                <TableCell>
                  {hasDiff ? (
                    <div className="relative">
                      <Textarea
                        placeholder="Masukkan alasan..."
                        value={reasons[item.id] || ''}
                        onChange={(e) => setReason(item.id, e.target.value)}
                        rows={2}
                        aria-label={`Alasan perbedaan ${item.productName}`}
                        className="min-h-0 w-full bg-background border-none shadow-none px-3 text-sm md:text-sm font-medium resize-none"
                      />
                      {!reasons[item.id] && <RequiredMark className="top-2" />}
                    </div>
                  ) : (
                    <MatchedMark />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 mb-6">
        {rows.map(({ item, physical, diff, hasDiff }) => (
          <div
            key={item.id}
            className={cn(
              'bg-background rounded-2xl p-4 space-y-3',
              hasDiff && 'ring-1 ring-amber-300/30',
            )}
          >
            <p className="font-bold text-sm">{item.productName}</p>

            {/* 3-col mini grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-card rounded-xl py-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Sistem</p>
                <p className="text-sm font-bold opacity-60">{item.systemStock}</p>
              </div>
              <div className="bg-card rounded-xl py-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Fisik</p>
                <p className="text-sm font-bold text-primary">{physical}</p>
              </div>
              <div className="bg-card rounded-xl py-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Selisih</p>
                <span
                  className={cn(
                    'text-sm font-bold',
                    diff > 0
                      ? 'text-green-600'
                      : diff < 0
                        ? 'text-red-600'
                        : 'text-muted-foreground',
                  )}
                >
                  {formatDiff(diff)}
                </span>
              </div>
            </div>

            <div>
              <Label
                htmlFor={`final-${item.id}`}
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Stok Final
              </Label>
              <Input
                id={`final-${item.id}`}
                type="number"
                min="0"
                value={finalValue(item.id)}
                onChange={(e) => setFinal(item.id, e.target.value)}
                className="w-full bg-card border-none px-3 text-center text-sm font-bold"
              />
            </div>

            {hasDiff ? (
              <div className="relative">
                <Label
                  htmlFor={`alasan-${item.id}`}
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block"
                >
                  Alasan Perbedaan
                </Label>
                <Textarea
                  id={`alasan-${item.id}`}
                  placeholder="Masukkan alasan..."
                  value={reasons[item.id] || ''}
                  onChange={(e) => setReason(item.id, e.target.value)}
                  rows={2}
                  className="min-h-0 w-full bg-card border-none shadow-none px-3 text-sm font-medium resize-none"
                />
                {!reasons[item.id] && <RequiredMark className="top-8" />}
              </div>
            ) : (
              <MatchedMark />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default StepResolveDifferences;
