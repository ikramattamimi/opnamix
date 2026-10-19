import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowRight, Receipt } from 'lucide-react';
import { BarChart } from '@/components/charts/BarChart';
import { ChartLegend } from '@/components/charts/ChartLegend';
import { ChartPanel, ChartSection } from '@/components/charts/ChartSection';
import { HBarList } from '@/components/charts/HBarList';
import { ListWithPanel } from '@/components/layout/ListWithPanel';
import { SidePanel, PanelSection } from '@/components/panel/SidePanel';
import { DefinitionList } from '@/components/panel/DefinitionList';
import { LineItems } from '@/components/panel/LineItems';
import { Totals } from '@/components/panel/Totals';
import { Toolbar } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { KpiStrip } from '@/components/data/KpiStrip';
import { StatusChip } from '@/components/data/StatusChip';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useListSelection } from '@/hooks/useListSelection';
import { isoDay } from '@/hooks/dateRange';
import type { DateRangeState } from '@/hooks/useDateRange';
import { formatDateTimeForDisplay, rp, rpShort } from '@/lib/format';
import { ROUTES } from '@/types/routes';
import { topSoldProducts, transactionBuckets, transactionSummary } from '../reportView';
import { exportTransactionsToExcel } from '../exportUtils';
import { useTransactionReport } from '../useReports';
import type { TransactionRow } from '../types';

type StatusFilter = 'Semua' | TransactionRow['status'];

const clock = (d: Date) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
const shortDate = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
const contents = (t: TransactionRow) =>
  [t.drugs.length && `${t.drugs.length} produk`, t.services.length && `${t.services.length} jasa`]
    .filter(Boolean)
    .join(' · ') || '-';

const COLUMNS: ColumnDef<TransactionRow>[] = [
  {
    id: 'date',
    header: 'Waktu',
    accessorFn: (t) => new Date(t.date).getTime(),
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
    header: 'Kode',
    accessorFn: (t) => t.code,
    cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
  },
  { id: 'kind', header: 'Jenis', accessorFn: (t) => t.kind },
  {
    id: 'patient',
    header: 'Pasien',
    accessorFn: (t) => t.patient,
    cell: ({ getValue }) => <b className="font-semibold">{getValue<string>()}</b>,
  },
  { id: 'by', header: 'Diajukan oleh', accessorFn: (t) => t.requestedBy },
  {
    id: 'isi',
    header: 'Isi',
    accessorFn: (t) => t.drugs.length + t.services.length,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{contents(row.original)}</span>
    ),
  },
  {
    id: 'total',
    header: 'Total',
    accessorFn: (t) => t.total,
    meta: { align: 'right' },
    cell: ({ getValue }) => rp(getValue<number>()),
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (t) => t.status,
    cell: ({ getValue }) =>
      getValue<string>() === 'Menunggu' ? (
        <StatusChip tone="warn">Menunggu</StatusChip>
      ) : (
        <StatusChip tone="ok">Selesai</StatusChip>
      ),
  },
];

const TransactionPanel: React.FC<{ trx: TransactionRow }> = ({ trx }) => {
  const navigate = useNavigate();
  return (
    <SidePanel
      icon={Receipt}
      tone={trx.status === 'Menunggu' ? 'warn' : 'ok'}
      eyebrow={`${trx.code} · ${trx.kind}`}
      title={trx.patient}
      badge={<StatusChip tone={trx.status === 'Menunggu' ? 'warn' : 'ok'}>{trx.status}</StatusChip>}
      footer={
        <Button
          className="sm:ml-auto"
          variant="outline"
          onClick={() => navigate(`${ROUTES.STOK_KELUAR}?sel=${encodeURIComponent(trx.code)}`)}
        >
          Buka di Stok Keluar
          <ArrowRight aria-hidden />
        </Button>
      }
    >
      <DefinitionList
        items={[
          { label: 'Dicatat', value: formatDateTimeForDisplay(trx.date) },
          { label: 'Diajukan oleh', value: trx.requestedBy },
          ...(trx.processedAt
            ? [
                {
                  label: 'Diproses',
                  value: `${formatDateTimeForDisplay(trx.processedAt)}${trx.processedBy ? ` · ${trx.processedBy}` : ''}`,
                },
              ]
            : []),
          ...(trx.note ? [{ label: 'Catatan', value: trx.note }] : []),
        ]}
      />
      {trx.drugs.length > 0 && (
        <PanelSection title={`Obat & BHP · ${trx.drugs.length}`}>
          <LineItems
            items={trx.drugs.map((d) => ({
              id: d.id,
              title: d.name,
              subtitle: `${d.quantity} ${d.unit?.toLowerCase() ?? ''} × ${rp(d.price)}`,
              amount: rp(d.subtotal),
            }))}
          />
        </PanelSection>
      )}
      {trx.services.length > 0 && (
        <PanelSection title={`Jasa · ${trx.services.length}`}>
          <LineItems
            items={trx.services.map((s) => ({ id: s.id, title: s.name, amount: rp(s.subtotal) }))}
          />
        </PanelSection>
      )}
      <Totals
        rows={[
          { label: 'Obat & BHP', value: rp(trx.drugTotal) },
          { label: 'Jasa', value: rp(trx.serviceTotal) },
          ...(trx.serviceFee ? [{ label: 'Biaya layanan', value: rp(trx.serviceFee) }] : []),
          ...(trx.discount ? [{ label: 'Diskon', value: `−${rp(trx.discount)}` }] : []),
        ]}
        grand={{ label: 'Total', value: rp(trx.total) }}
      />
    </SidePanel>
  );
};

export const TransactionReport: React.FC<{
  range: DateRangeState;
  registerExport: (fn: (() => void) | null) => void;
}> = ({ range, registerExport }) => {
  const { from, to, label } = range.range;
  const { data = [], isPending, isError, refetch } = useTransactionReport(from, to);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('Semua');
  const { selectedId, select, panelOpen, closePanel } = useListSelection<string>();

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('id-ID');
    return data.filter(
      (t) =>
        (status === 'Semua' || t.status === status) &&
        (!q || `${t.patient} ${t.code} ${t.requestedBy}`.toLocaleLowerCase('id-ID').includes(q)),
    );
  }, [data, status, query]);

  useEffect(() => {
    registerExport(() => void exportTransactionsToExcel(rows, label));
    return () => registerExport(null);
  }, [rows, label, registerExport]);

  if (isPending) return <LoadingState label="Memuat transaksi..." />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const s = transactionSummary(rows);
  const buckets = transactionBuckets(rows, from, to);
  const top = topSoldProducts(rows);
  const selected = rows.find((t) => t.id === selectedId);

  const list = (
    <Card className="flex flex-col gap-3 p-3">
      <Toolbar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Cari pasien, kode, atau pengaju"
          label="Cari transaksi"
        />
        <SegmentedControl<StatusFilter>
          label="Status"
          value={status}
          onChange={setStatus}
          options={(['Semua', 'Menunggu', 'Selesai'] as const).map((v) => ({ value: v, label: v }))}
        />
      </Toolbar>
      <KpiStrip
        items={[
          { label: 'Transaksi', value: s.count, note: `${s.pending} menunggu` },
          { label: 'Obat & BHP', value: rp(s.drugTotal), note: 'harga jual' },
          { label: 'Jasa', value: rp(s.serviceTotal), note: `${s.services} jasa` },
          { label: 'Total', value: rp(s.total), note: 'sesuai filter' },
        ]}
      />
      <DataTable
        columns={COLUMNS}
        data={rows}
        getRowId={(t) => t.id}
        pageSize={15}
        onRowClick={(t) => select(t.id)}
        selectedRowId={selectedId}
        emptyMessage="Tidak ada transaksi untuk filter dan periode ini."
      />
    </Card>
  );

  return (
    <div className="flex flex-col gap-3">
      <ChartSection
        title="Grafik transaksi"
        storageKey="report-transactions"
        summary={`${label} · ${s.count} transaksi · ${rpShort(s.total)}`}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ChartPanel
            title="Nilai transaksi · harga jual"
            aside={
              <ChartLegend
                items={[
                  { label: 'Obat & BHP', color: 'ser1' },
                  { label: 'Jasa', color: 'ser2' },
                ]}
              />
            }
          >
            <BarChart
              label={`Grafik nilai transaksi keluar, ${label}`}
              mode="stacked"
              series={[
                { key: 'obat', label: 'Obat & BHP', color: 'ser1' },
                { key: 'jasa', label: 'Jasa', color: 'ser2' },
              ]}
              data={buckets.map((b) => ({
                label: b.label,
                values: { obat: b.a, jasa: b.b },
                note: `${b.count} transaksi`,
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
          <ChartPanel title="Produk paling banyak keluar">
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
              <p className="text-note text-muted-foreground">
                Tidak ada transaksi dalam periode ini.
              </p>
            )}
          </ChartPanel>
        </div>
      </ChartSection>

      <ListWithPanel
        list={list}
        panel={
          selected ? (
            <TransactionPanel trx={selected} />
          ) : (
            <SidePanel icon={Receipt} eyebrow="Transaksi keluar" title="Detail transaksi">
              <EmptyState
                icon={Receipt}
                title="Pilih transaksi"
                description="Klik baris di tabel untuk melihat isi dan totalnya."
              />
            </SidePanel>
          )
        }
        panelOpen={panelOpen}
        onPanelClose={closePanel}
      />
    </div>
  );
};
