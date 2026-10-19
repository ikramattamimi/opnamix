import React, { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ChartPanel, ChartSection } from '@/components/charts/ChartSection';
import { HBarList } from '@/components/charts/HBarList';
import { Toolbar } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { KpiStrip } from '@/components/data/KpiStrip';
import { StatusChip } from '@/components/data/StatusChip';
import { ErrorState, LoadingState } from '@/components/common/QueryState';
import { DataTable } from '@/components/ui/data-table';
import { Card } from '@/components/ui/card';
import { formatDateForDisplay, rp, rpShort } from '@/lib/format';
import { useAllProducts } from '@/features/products/useProducts';
import {
  CATEGORIES,
  CATEGORY_META,
  STOCK_STATUS_META,
  productMatches,
  stockStatus,
  type StockStatus,
} from '@/features/products/catalog';
import type { Category, Product } from '@/features/products/types';
import { useOpnameHistory } from '@/features/opname/useOpname';
import { lastOpnamedAt } from '@/features/opname/summary';
import { positionSummary, stockValue, topByStockValue, valueByCategory } from '../reportView';
import { exportStockPositionToExcel } from '../exportUtils';

type CategoryFilter = 'Semua' | Category;
type StatusFilter = 'Semua' | Exclude<StockStatus, 'aman'>;
const STATUS_ORDER: Record<StockStatus, number> = { habis: 0, menipis: 1, aman: 2 };

export const PositionReport: React.FC<{
  registerExport: (fn: (() => void) | null) => void;
}> = ({ registerExport }) => {
  const { data: products = [], isPending, isError, refetch } = useAllProducts();
  const { data: history = [] } = useOpnameHistory();
  const lastOpname = useMemo(() => lastOpnamedAt(history), [history]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('Semua');
  const [status, setStatus] = useState<StatusFilter>('Semua');

  const rows = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === 'Semua' || p.category === category) &&
          (status === 'Semua' || stockStatus(p) === status) &&
          productMatches(p, query),
      ),
    [products, category, status, query],
  );

  useEffect(() => {
    registerExport(() => void exportStockPositionToExcel(rows, lastOpname));
    return () => registerExport(null);
  }, [rows, lastOpname, registerExport]);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: 'name',
        header: 'Produk',
        accessorFn: (p) => p.name,
        cell: ({ row }) => <b className="font-semibold">{row.original.name}</b>,
      },
      { id: 'brand', header: 'Merek', accessorFn: (p) => p.brand || 'Generik' },
      {
        id: 'cat',
        header: 'Kategori',
        accessorFn: (p) => CATEGORY_META[p.category]?.short ?? p.category,
      },
      {
        id: 'stock',
        header: 'Stok',
        accessorFn: (p) => p.stock,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <>
            {row.original.stock.toLocaleString('id-ID')}{' '}
            <span className="text-xs text-muted-foreground">{row.original.unit.toLowerCase()}</span>
          </>
        ),
      },
      { id: 'min', header: 'Min.', accessorFn: (p) => p.minStock, meta: { align: 'right' } },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (p) => STATUS_ORDER[stockStatus(p)],
        cell: ({ row }) => {
          const meta = STOCK_STATUS_META[stockStatus(row.original)];
          return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
        },
      },
      {
        id: 'buy',
        header: 'Harga beli',
        accessorFn: (p) => p.purchasePrice,
        meta: { align: 'right' },
        cell: ({ getValue }) => rp(getValue<number>()),
      },
      {
        id: 'value',
        header: 'Nilai',
        accessorFn: stockValue,
        meta: { align: 'right' },
        cell: ({ getValue }) => rp(getValue<number>()),
      },
      {
        id: 'last',
        header: 'Opname terakhir',
        accessorFn: (p) => lastOpname.get(p.id)?.getTime() ?? 0,
        cell: ({ row }) => {
          const d = lastOpname.get(row.original.id);
          return d ? (
            formatDateForDisplay(d.toISOString())
          ) : (
            <span className="text-muted-foreground">Belum pernah</span>
          );
        },
      },
    ],
    [lastOpname],
  );

  if (isPending) return <LoadingState label="Memuat posisi stok..." />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const s = positionSummary(rows);
  const byCat = valueByCategory(rows);
  const top = topByStockValue(rows);
  const topShare = s.value
    ? Math.round((top.reduce((a, p) => a + stockValue(p), 0) / s.value) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-3">
      <ChartSection
        title="Grafik posisi stok"
        storageKey="report-position"
        summary={`Nilai persediaan ${rpShort(s.value)} · ${s.count} produk`}
      >
        {rows.length === 0 ? (
          <p className="text-note text-muted-foreground">Tidak ada produk untuk filter ini.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <ChartPanel title="Nilai persediaan per kategori" aside={rpShort(s.value)}>
              <HBarList
                ranked={false}
                items={byCat.map((c) => ({
                  id: c.category,
                  label: CATEGORY_META[c.category].short,
                  sub: `${c.count} produk`,
                  value: c.value,
                  display: rpShort(c.value),
                  color: CATEGORY_META[c.category].tone,
                }))}
              />
            </ChartPanel>
            <ChartPanel
              title={`${top.length} produk bernilai terbesar`}
              aside={`${topShare}% dari nilai`}
            >
              <HBarList
                items={top.map((p) => ({
                  id: p.id,
                  label: p.name,
                  sub: p.brand || 'Generik',
                  value: stockValue(p),
                  display: rpShort(stockValue(p)),
                  color: 'ser1',
                }))}
              />
            </ChartPanel>
          </div>
        )}
      </ChartSection>

      <Card className="flex flex-col gap-3 p-3">
        <Toolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Cari produk, merek, atau kandungan"
            label="Cari produk"
          />
          <SegmentedControl<CategoryFilter>
            label="Kategori"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'Semua', label: 'Semua' },
              ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_META[c].short })),
            ]}
          />
          <SegmentedControl<StatusFilter>
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'Semua', label: 'Semua status' },
              { value: 'menipis', label: 'Menipis' },
              { value: 'habis', label: 'Habis' },
            ]}
          />
        </Toolbar>
        <KpiStrip
          items={[
            { label: 'Nilai persediaan', value: rp(s.value), note: 'harga beli' },
            { label: 'Produk', value: s.count, note: 'sesuai filter' },
            { label: 'Menipis', value: s.menipis, note: 'di bawah minimum' },
            { label: 'Habis', value: s.habis, note: 'stok 0' },
          ]}
        />
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(p) => p.id}
          pageSize={15}
          emptyMessage="Tidak ada produk untuk filter ini."
        />
      </Card>
    </div>
  );
};
