import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { OpnameItem } from '../../types';
import { calculateOpnameDifference } from '../../opnameCalc';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { StockInputs } from './useOpnameExecution';

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
      'absolute right-2 text-[10px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded uppercase',
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
    <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
      <div className="mb-6">
        <h3 className="text-lg font-bold">Tahap 3: Penyesuaian Stok</h3>
        <p className="text-sm text-text-secondary-light">
          Review selisih dan tentukan stok final. Alasan wajib diisi jika ada selisih.
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto mb-6">
        <table className="w-full text-left">
          <thead className="border-b border-gray-100 dark:border-gray-800">
            <tr className="text-xs uppercase font-bold text-text-secondary-light tracking-wider">
              <th className="px-3 py-3">Nama Produk</th>
              <th className="px-3 py-3 text-center">Stok Sistem</th>
              <th className="px-3 py-3 text-center">Stok Fisik</th>
              <th className="px-3 py-3 text-center">Selisih</th>
              <th className="px-3 py-3 text-center w-32">Stok Final</th>
              <th className="px-3 py-3 w-64">Alasan Perbedaan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map(({ item, physical, diff, hasDiff }) => (
              <tr
                key={item.id}
                className={cn('transition-colors', hasDiff && 'bg-amber-500/[0.03]')}
              >
                <td className="px-3 py-4">
                  <p className="font-bold text-sm">{item.productName}</p>
                </td>
                <td className="px-3 py-4 text-center font-medium text-sm opacity-60">
                  {item.systemStock}
                </td>
                <td className="px-3 py-4 text-center font-bold text-sm text-primary">{physical}</td>
                <td className="px-3 py-4 text-center">
                  <span
                    className={cn(
                      'font-bold px-2 py-1 rounded-full text-xs',
                      diff > 0
                        ? 'bg-green-100 text-green-600'
                        : diff < 0
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-text-secondary-light',
                    )}
                  >
                    {formatDiff(diff)}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <Input
                    type="number"
                    min="0"
                    value={finalValue(item.id)}
                    onChange={(e) => setFinal(item.id, e.target.value)}
                    aria-label={`Stok final ${item.productName}`}
                    className="h-auto w-full bg-background-light dark:bg-background-dark border-none rounded-xl px-3 py-2 text-center text-sm md:text-sm font-bold"
                  />
                </td>
                <td className="px-3 py-4">
                  {hasDiff ? (
                    <div className="relative">
                      <Textarea
                        placeholder="Masukkan alasan..."
                        value={reasons[item.id] || ''}
                        onChange={(e) => setReason(item.id, e.target.value)}
                        rows={2}
                        aria-label={`Alasan perbedaan ${item.productName}`}
                        className="min-h-0 w-full bg-background-light dark:bg-background-dark border-none shadow-none rounded-xl px-3 py-2 text-sm md:text-sm font-medium resize-none"
                      />
                      {!reasons[item.id] && <RequiredMark className="top-2" />}
                    </div>
                  ) : (
                    <MatchedMark />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 mb-6">
        {rows.map(({ item, physical, diff, hasDiff }) => (
          <div
            key={item.id}
            className={cn(
              'bg-background-light dark:bg-background-dark rounded-2xl p-4 space-y-3',
              hasDiff && 'ring-1 ring-amber-300/30',
            )}
          >
            <p className="font-bold text-sm">{item.productName}</p>

            {/* 3-col mini grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-card-light dark:bg-card-dark rounded-xl py-2">
                <p className="text-[10px] font-bold text-text-secondary-light uppercase">Sistem</p>
                <p className="text-sm font-bold opacity-60">{item.systemStock}</p>
              </div>
              <div className="bg-card-light dark:bg-card-dark rounded-xl py-2">
                <p className="text-[10px] font-bold text-text-secondary-light uppercase">Fisik</p>
                <p className="text-sm font-bold text-primary">{physical}</p>
              </div>
              <div className="bg-card-light dark:bg-card-dark rounded-xl py-2">
                <p className="text-[10px] font-bold text-text-secondary-light uppercase">Selisih</p>
                <span
                  className={cn(
                    'text-sm font-bold',
                    diff > 0
                      ? 'text-green-600'
                      : diff < 0
                        ? 'text-red-600'
                        : 'text-text-secondary-light',
                  )}
                >
                  {formatDiff(diff)}
                </span>
              </div>
            </div>

            <div>
              <Label
                htmlFor={`final-${item.id}`}
                className="text-xs font-bold text-text-secondary-light uppercase tracking-wider mb-1.5 block"
              >
                Stok Final
              </Label>
              <Input
                id={`final-${item.id}`}
                type="number"
                min="0"
                value={finalValue(item.id)}
                onChange={(e) => setFinal(item.id, e.target.value)}
                className="h-auto w-full bg-card-light dark:bg-card-dark border-none rounded-xl px-3 py-2.5 text-center text-sm font-bold"
              />
            </div>

            {hasDiff ? (
              <div className="relative">
                <Label
                  htmlFor={`alasan-${item.id}`}
                  className="text-xs font-bold text-text-secondary-light uppercase tracking-wider mb-1.5 block"
                >
                  Alasan Perbedaan
                </Label>
                <Textarea
                  id={`alasan-${item.id}`}
                  placeholder="Masukkan alasan..."
                  value={reasons[item.id] || ''}
                  onChange={(e) => setReason(item.id, e.target.value)}
                  rows={2}
                  className="min-h-0 w-full bg-card-light dark:bg-card-dark border-none shadow-none rounded-xl px-3 py-2 text-sm font-medium resize-none"
                />
                {!reasons[item.id] && <RequiredMark className="top-8" />}
              </div>
            ) : (
              <MatchedMark />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepResolveDifferences;
