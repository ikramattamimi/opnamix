import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { BarChart } from '@/components/charts/BarChart';
import { ChartLegend } from '@/components/charts/ChartLegend';
import { ChartPanel, ChartSection } from '@/components/charts/ChartSection';
import { HBarList } from '@/components/charts/HBarList';
import { Toolbar } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { KpiStrip } from '@/components/data/KpiStrip';
import { StatusChip, type StatusTone } from '@/components/data/StatusChip';
import { SignedValue } from '@/components/data/SignedValue';
import { ErrorState, LoadingState } from '@/components/common/QueryState';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { isoDay } from '@/hooks/dateRange';
import type { DateRangeState } from '@/hooks/useDateRange';
import { rp, rpShort, signed } from '@/lib/format';
import { ROUTES, opnamePath } from '@/types/routes';
import { productMatches } from '@/features/products/catalog';
import { mutationBuckets, mutationSummary, topMovedProducts } from '../reportView';
import { exportMutationsToExcel } from '../exportUtils';
import { useStockMutations } from '../useReports';
import type { MutationRow, MutationType } from '../types';

type TypeFilter = 'Semua' | MutationType;
const TYPE_TONE: Record<MutationType, StatusTone> = {
  Masuk: 'info',
  Keluar: 'neutral',
  Penyesuaian: 'warn',
};

const clock = (d: Date) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
const shortDate = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

export const MutationReport: React.FC<{
  range: DateRangeState;
  registerExport: (fn: (() => void) | null) => void;
}> = ({ range, registerExport }) => {
  const navigate = useNavigate();
  const { from, to, label } = range.range;
  const { data = [], isPending, isError, refetch } = useStockMutations(from, to);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('Semua');

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('id-ID');
    return data.filter(
      (m) =>
        (type === 'Semua' || m.type === type) &&
        (productMatches(m.product, query) ||
          `${m.code} ${m.note}`.toLocaleLowerCase('id-ID').includes(q)),
    );
  }, [data, type, query]);

  useEffect(() => {
    registerExport(() => void exportMutationsToExcel(rows, label));
    return () => registerExport(null);
  }, [rows, label, registerExport]);

  const columns = useMemo<ColumnDef<MutationRow>[]>(() => {
    const open = (m: MutationRow) => {
      if (m.link.kind === 'opname') navigate(opnamePath(m.link.id, 'laporan'));
      else if (m.link.kind === 'stock-out')
        navigate(`${ROUTES.STOK_KELUAR}?sel=${encodeURIComponent(m.link.id)}`);
      else navigate(ROUTES.STOK_MASUK);
    };
    return [
      {
        id: 'date',
        header: 'Waktu',
        accessorFn: (m) => new Date(m.date).getTime(),
        cell: ({ row }) => {
          const d = new Date(row.original.date);
          return (
            <span className="whitespace-nowrap">
              {shortDate(d)} <span className="text-xs text-muted-foreground">{clock(d)}</span>
            </span>
          );
        },
      },
      {
        id: 'code',
        header: 'No. transaksi',
        accessorFn: (m) => m.code,
        cell: ({ row }) => (
          <Button
            variant="link"
            size="sm"
            className="h-auto px-0 font-mono text-xs"
            onClick={() => open(row.original)}
          >
            {row.original.code}
          </Button>
        ),
      },
      {
        id: 'type',
        header: 'Tipe',
        accessorFn: (m) => m.type,
        cell: ({ row }) => (
          <StatusChip tone={TYPE_TONE[row.original.type]} plain>
            {row.original.type}
          </StatusChip>
        ),
      },
      {
        id: 'product',
        header: 'Produk',
        accessorFn: (m) => m.product.name,
        cell: ({ row }) => <b className="font-semibold">{row.original.product.name}</b>,
      },
      { id: 'brand', header: 'Merek', accessorFn: (m) => m.product.brand || 'Generik' },
      {
        id: 'qty',
        header: 'Jumlah',
        accessorFn: (m) => m.qty,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <>
            <b>
              <SignedValue value={row.original.qty} />
            </b>{' '}
            <span className="text-xs text-muted-foreground">
              {row.original.product.unit.toLowerCase()}
            </span>
          </>
        ),
      },
      { id: 'by', header: 'Oleh', accessorFn: (m) => m.by },
      {
        id: 'note',
        header: 'Keterangan',
        accessorFn: (m) => m.note,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">{getValue<string>()}</span>
        ),
      },
    ];
  }, [navigate]);

  if (isPending) return <LoadingState label="Memuat mutasi stok..." />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const s = mutationSummary(rows);
  const buckets = mutationBuckets(rows, from, to);
  const top = topMovedProducts(rows);

  return (
    <div className="flex flex-col gap-3">
      <ChartSection
        title="Grafik mutasi"
        storageKey="report-mutation"
        summary={`${label} · masuk ${rpShort(s.inValue)} · keluar ${rpShort(s.outValue)}`}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ChartPanel
            title="Nilai masuk dan keluar · harga beli"
            aside={
              <ChartLegend
                items={[
                  { label: 'Masuk', color: 'ser1' },
                  { label: 'Keluar', color: 'ser2' },
                ]}
              />
            }
          >
            <BarChart
              label={`Grafik nilai masuk dan keluar, ${label}`}
              series={[
                { key: 'in', label: 'Masuk', color: 'ser1' },
                { key: 'out', label: 'Keluar', color: 'ser2' },
              ]}
              data={buckets.map((b) => ({
                label: b.label,
                values: { in: b.a, out: b.b },
                note: `${b.count} baris${b.extra ? ` · ${b.extra} penyesuaian` : ''}`,
              }))}
              formatValue={rp}
              formatAxis={rpShort}
              clickHint="klik untuk menyaring periode ini"
              onBucketClick={
                buckets.length > 1
                  ? (i) => {
                      range.setCustom({
                        from: isoDay(buckets[i].start),
                        to: isoDay(buckets[i].end),
                      });
                      range.setPreset('custom');
                    }
                  : undefined
              }
            />
          </ChartPanel>
          <ChartPanel title="Nilai pergerakan terbesar">
            {top.length ? (
              <HBarList
                items={top.map((t) => ({
                  id: t.id,
                  label: t.name,
                  sub: t.brand,
                  value: t.value,
                  display: rpShort(t.value),
                  color: 'ser1',
                }))}
              />
            ) : (
              <p className="text-note text-muted-foreground">Tidak ada mutasi dalam periode ini.</p>
            )}
          </ChartPanel>
        </div>
      </ChartSection>

      <Card className="flex flex-col gap-3 p-3">
        <Toolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Cari produk, nomor transaksi, atau keterangan"
            label="Cari mutasi"
          />
          <SegmentedControl<TypeFilter>
            label="Tipe"
            value={type}
            onChange={setType}
            options={(['Semua', 'Masuk', 'Keluar', 'Penyesuaian'] as const).map((v) => ({
              value: v,
              label: v,
            }))}
          />
        </Toolbar>
        <KpiStrip
          items={[
            { label: 'Masuk', value: `${signed(s.inUnits)} unit`, note: `${s.inRows} baris` },
            { label: 'Keluar', value: `${signed(s.outUnits)} unit`, note: `${s.outRows} baris` },
            {
              label: 'Penyesuaian opname',
              value: `${signed(s.adjUnits)} unit`,
              note: `${s.adjRows} baris`,
            },
            { label: 'Total baris', value: s.total, note: 'sesuai filter' },
          ]}
        />
        <p className="text-note text-muted-foreground">
          Permintaan yang belum diproses tidak termasuk karena stoknya belum berkurang.
        </p>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(m) => m.key}
          pageSize={15}
          emptyMessage="Tidak ada data untuk filter dan periode ini."
        />
      </Card>
    </div>
  );
};
