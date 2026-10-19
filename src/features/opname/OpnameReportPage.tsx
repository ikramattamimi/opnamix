import React, { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Printer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar, ToolbarSpacer } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { KpiStrip } from '@/components/data/KpiStrip';
import { SignedValue } from '@/components/data/SignedValue';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { formatDateTimeForDisplay } from '@/lib/format';
import { ROUTES, opnamePath } from '@/types/routes';
import { CATEGORY_META, productMatches } from '@/features/products/catalog';
import { diffOf, diffReasonLabel, finalOf, runStats, valueOf, type RunItem } from './catalog';
import { useOpnameRun } from './useOpname';
import { exportOpnameToExcel } from './export';

type Filter = 'Semua' | 'Selisih' | 'Sesuai';
const isDiff = (i: RunItem) => (diffOf(i) ?? 0) !== 0;

const COLUMNS: ColumnDef<RunItem>[] = [
  {
    id: 'produk',
    header: 'Produk',
    accessorFn: (i) => i.product.name,
    cell: ({ row }) => <b className="font-semibold">{row.original.product.name}</b>,
  },
  { id: 'merek', header: 'Merek', accessorFn: (i) => i.product.brand || 'Generik' },
  {
    id: 'kategori',
    header: 'Kategori',
    accessorFn: (i) => CATEGORY_META[i.product.category]?.short ?? i.product.category,
  },
  { id: 'sistem', header: 'Sistem', accessorFn: (i) => i.systemStock, meta: { align: 'right' } },
  {
    id: 'fisik',
    header: 'Final',
    accessorFn: (i) => finalOf(i) ?? 0,
    meta: { align: 'right' },
    cell: ({ row }) => {
      const i = row.original;
      return i.finalStock !== null ? (
        <span title={`Hitung fisik ${i.physicalStock}`}>{i.finalStock}*</span>
      ) : (
        i.physicalStock
      );
    },
  },
  {
    id: 'selisih',
    header: 'Selisih',
    accessorFn: (i) => diffOf(i) ?? 0,
    meta: { align: 'right' },
    cell: ({ getValue }) => <SignedValue value={getValue<number>()} />,
  },
  {
    id: 'nilai',
    header: 'Nilai',
    accessorFn: valueOf,
    meta: { align: 'right' },
    cell: ({ getValue }) => <SignedValue value={getValue<number>()} currency zero="—" />,
  },
  {
    id: 'alasan',
    header: 'Alasan',
    accessorFn: (i) => diffReasonLabel(i) ?? '',
    cell: ({ row }) => {
      const label = diffReasonLabel(row.original);
      return label ? (
        <span title={row.original.note ?? undefined}>
          {label}
          {row.original.note && (
            <small className="block text-xs text-muted-foreground">{row.original.note}</small>
          )}
        </span>
      ) : (
        <span className="text-faint">Sesuai</span>
      );
    },
  },
];

const OpnameReportPage: React.FC = () => {
  const { opnameId } = useParams<{ opnameId: string }>();
  const { showToast } = useToast();
  const { data: run, isPending, isError, refetch } = useOpnameRun(opnameId);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Semua');

  const rows = useMemo(
    () =>
      (run?.items ?? []).filter(
        (i) =>
          (filter === 'Semua' || (filter === 'Selisih') === isDiff(i)) &&
          productMatches(i.product, query),
      ),
    [run, filter, query],
  );

  if (isPending) {
    return (
      <>
        <PageHeader back={ROUTES.STOK_OPNAME} />
        <LoadingState label="Memuat laporan..." />
      </>
    );
  }
  if (isError || !run) {
    return (
      <>
        <PageHeader title="Laporan tidak ditemukan" back={ROUTES.STOK_OPNAME} />
        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <EmptyState title="Opname ini tidak ada." />
        )}
      </>
    );
  }
  if (run.status !== 'selesai') return <Navigate to={opnamePath(run.id, 'hitung')} replace />;

  const s = runStats(run.items);

  return (
    <>
      <PageHeader
        title={run.name}
        back={ROUTES.STOK_OPNAME}
        stats={[
          { id: 'code', label: 'Kode', value: run.code },
          {
            id: 'done',
            label: 'Selesai',
            value: formatDateTimeForDisplay(run.completedAt ?? undefined),
          },
          { id: 'by', label: 'Petugas', value: run.auditor },
        ]}
        actions={
          <>
            <Button
              variant="glass"
              onClick={() =>
                void exportOpnameToExcel(run).catch(() =>
                  showToast('Gagal mengekspor laporan.', 'error'),
                )
              }
            >
              <Download aria-hidden />
              Ekspor Excel
            </Button>
            <Button variant="light" onClick={() => window.print()}>
              <Printer aria-hidden />
              Cetak berita acara
            </Button>
          </>
        }
      />
      <div className="flex flex-col gap-3">
        <KpiStrip
          items={[
            { label: 'Produk dihitung', value: s.n },
            { label: 'Sesuai', value: s.ok },
            { label: 'Selisih', value: s.diff },
            {
              label: 'Kurang',
              swatch: 'bg-chart-minus',
              value: <SignedValue value={s.minus} currency />,
            },
            {
              label: 'Lebih',
              swatch: 'bg-chart-plus',
              value: <SignedValue value={s.plus} currency />,
            },
            { label: 'Nilai bersih', value: <SignedValue value={s.net} currency zero="Rp 0" /> },
          ]}
        />
        <Card className="flex flex-col gap-3 p-3">
          <Toolbar>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Cari produk"
              label="Cari produk"
            />
            <SegmentedControl<Filter>
              label="Filter laporan"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'Semua', label: 'Semua', count: s.n },
                { value: 'Selisih', label: 'Selisih', count: s.diff },
                { value: 'Sesuai', label: 'Sesuai', count: s.n - s.diff },
              ]}
            />
            <ToolbarSpacer />
            <span className="text-note text-muted-foreground">
              Jadwal: {run.scheduleName ?? 'Opname cepat'}
            </span>
          </Toolbar>
          <DataTable
            columns={COLUMNS}
            data={rows}
            getRowId={(i) => i.detailId}
            pageSize={15}
            emptyMessage="Tidak ada produk yang cocok."
          />
          <p className="text-note text-muted-foreground">
            * Stok final diubah setelah hitung fisik. Nilai memakai harga beli saat laporan dibuka.
          </p>
        </Card>
      </div>
    </>
  );
};

export default OpnameReportPage;
