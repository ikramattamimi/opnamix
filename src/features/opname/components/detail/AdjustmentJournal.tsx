import React, { useMemo, useState } from 'react';
import { Archive, MessageSquare, Search, Sheet, TriangleAlert } from 'lucide-react';
import type { OpnameDetailViewRow } from '../../api';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState } from '@/components/common/QueryState';
import { cn } from '@/lib/utils';

const formatDiff = (selisih: number | null) => ((selisih ?? 0) > 0 ? `+${selisih}` : selisih);

interface AdjustmentJournalProps {
  rows: OpnameDetailViewRow[];
  isError: boolean;
  onRetry: () => void;
}

// Jurnal penyesuaian: baris detail opname yang sudah selesai, dengan pencarian produk
const AdjustmentJournal: React.FC<AdjustmentJournalProps> = ({ rows, isError, onRetry }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((d) => d.productName.toLowerCase().includes(q));
  }, [rows, search]);
  const emptyTitle = search ? 'Tidak ada produk yang cocok.' : 'Tidak ada data.';

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Sheet className="size-5 text-primary" aria-hidden />
          Jurnal Penyesuaian
        </h3>
        <div className="relative w-full sm:w-72">
          <Search
            className="size-4 text-text-secondary-light absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="text"
            placeholder="Cari produk..."
            aria-label="Cari produk"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-auto w-full bg-background-light dark:bg-background-dark border-none rounded-xl pl-9 pr-4 py-2.5 text-sm md:text-sm font-medium placeholder:text-text-secondary-light/50 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {isError ? (
        <ErrorState title="Gagal memuat jurnal penyesuaian" onRetry={onRetry} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Archive} title={emptyTitle} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 dark:border-gray-800">
                <tr className="text-xs uppercase font-bold text-text-secondary-light tracking-wider">
                  <th className="px-4 py-3">Nama Produk</th>
                  <th className="px-4 py-3 text-center">Stok Sistem</th>
                  <th className="px-4 py-3 text-center">Stok Fisik</th>
                  <th className="px-4 py-3 text-center">Selisih</th>
                  <th className="px-4 py-3 text-center">Stok Final</th>
                  <th className="px-4 py-3">Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-white/5 transition-colors',
                      row.selisih !== 0 && 'bg-amber-500/[0.03]',
                    )}
                  >
                    <td className="px-4 py-4 font-bold text-sm">{row.productName}</td>
                    <td className="px-4 py-4 text-center text-sm opacity-60">{row.stokSistem}</td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-primary">
                      {row.stokFisik}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={cn(
                          'font-bold px-2 py-1 rounded-full text-xs',
                          (row.selisih ?? 0) > 0
                            ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                            : (row.selisih ?? 0) < 0
                              ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                              : 'bg-gray-100 text-text-secondary-light dark:bg-gray-500/20',
                        )}
                      >
                        {formatDiff(row.selisih)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold">
                      {row.stokFinal !== null ? row.stokFinal : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm">{row.alasan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((row) => (
              <div
                key={row.id}
                className={cn(
                  'bg-background-light dark:bg-background-dark rounded-2xl p-4 space-y-3',
                  row.selisih !== 0 && 'ring-2 ring-amber-300/30',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-sm flex-1">{row.productName}</p>
                  {row.selisih !== 0 && (
                    <TriangleAlert className="size-4 text-amber-500" aria-label="Ada selisih" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Sistem', value: row.stokSistem, className: 'opacity-60' },
                    { label: 'Fisik', value: row.stokFisik, className: 'text-primary' },
                    {
                      label: 'Selisih',
                      value: formatDiff(row.selisih),
                      className:
                        (row.selisih ?? 0) > 0
                          ? 'text-green-600 dark:text-green-400'
                          : (row.selisih ?? 0) < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-text-secondary-light',
                    },
                    { label: 'Final', value: row.stokFinal !== null ? row.stokFinal : '-' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-card-light dark:bg-card-dark rounded-xl p-3 text-center"
                    >
                      <p className="text-[10px] font-bold text-text-secondary-light uppercase mb-1">
                        {stat.label}
                      </p>
                      <p className={cn('text-base font-bold', stat.className)}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {row.alasan && (
                  <div className="bg-card-light dark:bg-card-dark rounded-xl p-3">
                    <p className="text-[10px] font-bold text-text-secondary-light uppercase mb-1.5 flex items-center gap-1">
                      <MessageSquare className="size-3" aria-hidden />
                      Alasan
                    </p>
                    <p className="text-xs text-text-primary-light dark:text-white leading-relaxed">
                      {row.alasan}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdjustmentJournal;
