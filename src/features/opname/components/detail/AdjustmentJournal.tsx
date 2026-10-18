import React, { useMemo, useState } from 'react';
import { Archive, MessageSquare, Search, Sheet, TriangleAlert } from 'lucide-react';
import type { OpnameDetailViewRow } from '../../api';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState } from '@/components/common/QueryState';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

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
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Sheet className="size-5 text-primary" aria-hidden />
          Jurnal Penyesuaian
        </h3>
        <div className="relative w-full sm:w-72">
          <Search
            className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="text"
            placeholder="Cari produk..."
            aria-label="Cari produk"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border-none pl-9 pr-4 text-sm md:text-sm font-medium placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20"
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
            <Table>
              <TableHeader>
                <TableRow className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  <TableHead>Nama Produk</TableHead>
                  <TableHead className="text-center">Stok Sistem</TableHead>
                  <TableHead className="text-center">Stok Fisik</TableHead>
                  <TableHead className="text-center">Selisih</TableHead>
                  <TableHead className="text-center">Stok Final</TableHead>
                  <TableHead>Alasan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-white/5 transition-colors',
                      row.selisih !== 0 && 'bg-amber-500/[0.03]',
                    )}
                  >
                    <TableCell className="font-bold">{row.productName}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {row.stokSistem}
                    </TableCell>
                    <TableCell className="text-center font-bold text-primary">
                      {row.stokFisik}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          (row.selisih ?? 0) > 0 ? 'ok' : (row.selisih ?? 0) < 0 ? 'bad' : 'neutral'
                        }
                      >
                        {formatDiff(row.selisih)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {row.stokFinal !== null ? row.stokFinal : '-'}
                    </TableCell>
                    <TableCell>{row.alasan || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((row) => (
              <div
                key={row.id}
                className={cn(
                  'bg-background rounded-2xl p-4 space-y-3',
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
                            : 'text-muted-foreground',
                    },
                    { label: 'Final', value: row.stokFinal !== null ? row.stokFinal : '-' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card rounded-xl p-3 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        {stat.label}
                      </p>
                      <p className={cn('text-base font-bold', stat.className)}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {row.alasan && (
                  <div className="bg-card rounded-xl p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                      <MessageSquare className="size-3" aria-hidden />
                      Alasan
                    </p>
                    <p className="text-xs text-foreground leading-relaxed">{row.alasan}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export default AdjustmentJournal;
