import React, { useMemo } from 'react';
import { ChartColumn } from 'lucide-react';
import { ChartSection, ChartPanel } from '@/components/charts/ChartSection';
import { BarChart } from '@/components/charts/BarChart';
import { ChartLegend } from '@/components/charts/ChartLegend';
import { HBarList } from '@/components/charts/HBarList';
import { CompositionBar } from '@/components/charts/CompositionBar';
import { BUCKET_UNIT_LABEL, bucketUnit } from '@/components/charts/timeBuckets';
import { KpiStrip } from '@/components/data/KpiStrip';
import { SignedValue } from '@/components/data/SignedValue';
import { EmptyState } from '@/components/common/QueryState';
import { DateRangeControl } from '@/components/form/DateRangeControl';
import { isoDay } from '@/hooks/dateRange';
import type { DateRangeState } from '@/hooks/useDateRange';
import { rpShort, rpSigned } from '@/lib/format';
import { REASONS } from '../catalog';
import { summarizeOpnames } from '../summary';
import type { OpnameRun } from '../types';

// Ringkasan selisih opname selesai. Rentangnya juga menyaring riwayat di daftar.

const pct = (n: number | null) =>
  n === null ? '—' : `${n.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;

const rpSignedShort = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + rpShort(Math.abs(n));

export const OpnameSummary: React.FC<{
  history: OpnameRun[];
  range: DateRangeState;
  onProductSelect?: (productId: string) => void;
}> = ({ history, range, onProductSelect }) => {
  const { from, to, label } = range.range;
  const s = useMemo(() => summarizeOpnames(history, from, to), [history, from, to]);
  const unit = BUCKET_UNIT_LABEL[bucketUnit(from, to)];

  return (
    <ChartSection
      title="Ringkasan selisih"
      storageKey="opname-summary"
      summary={
        <>
          {label} · bersih <b className="text-foreground">{rpSigned(s.net)}</b> · akurasi{' '}
          <b className="text-foreground">{pct(s.accuracy)}</b> · {s.runs.length} sesi
        </>
      }
      controls={<DateRangeControl state={range} presets={['7', '30', '90', '365', 'custom']} />}
    >
      <KpiStrip
        items={[
          {
            label: 'Nilai bersih',
            value: <SignedValue value={s.net} currency />,
            note: `${s.diffs} produk selisih`,
          },
          {
            label: 'Kurang',
            swatch: 'bg-chart-minus',
            value: rpSigned(s.minus),
            note: `${s.minusCount} produk`,
          },
          {
            label: 'Lebih',
            swatch: 'bg-chart-plus',
            value: rpSigned(s.plus),
            note: `${s.plusCount} produk`,
          },
          {
            label: 'Akurasi hitung',
            value: pct(s.accuracy),
            note: `${s.counted - s.diffs} dari ${s.counted} produk cocok`,
          },
          {
            label: 'Opname selesai',
            value: `${s.runs.length} sesi`,
            note: `${s.counted} produk dihitung`,
          },
        ]}
      />

      {s.runs.length === 0 ? (
        <EmptyState
          icon={ChartColumn}
          title="Belum ada opname selesai dalam rentang ini"
          description="Pilih rentang yang lebih panjang."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <ChartPanel
            title={`Selisih per ${unit}`}
            aside={
              <ChartLegend
                items={[
                  { label: 'Kurang', color: 'minus' },
                  { label: 'Lebih', color: 'plus' },
                ]}
              />
            }
          >
            <BarChart
              label={`Grafik selisih opname ${label}`}
              mode="stacked"
              series={[
                { key: 'minus', label: 'Kurang', color: 'minus' },
                { key: 'plus', label: 'Lebih', color: 'plus' },
              ]}
              data={s.buckets.map((b) => ({
                label: b.label,
                values: { minus: b.minus, plus: b.plus },
                note: `${b.sessions} sesi`,
              }))}
              formatValue={rpSigned}
              formatAxis={rpSignedShort}
              onBucketClick={(i) => {
                const b = s.buckets[i];
                range.setCustom({ from: isoDay(b.start), to: isoDay(b.end) });
                range.setPreset('custom');
              }}
            />
          </ChartPanel>

          <ChartPanel title="Selisih terbesar">
            {s.top.length ? (
              <HBarList
                items={s.top.map((t) => ({
                  id: t.productId,
                  label: t.item.product.name,
                  sub: t.item.product.brand || 'Generik',
                  value: t.value,
                  display: <SignedValue value={t.value} currency />,
                  color: t.value < 0 ? 'minus' : 'plus',
                }))}
                onSelect={onProductSelect}
              />
            ) : (
              <p className="text-note text-muted-foreground">
                Tidak ada selisih dalam rentang ini.
              </p>
            )}
          </ChartPanel>

          <ChartPanel title="Alasan selisih" aside={`${s.diffs} produk`}>
            {s.reasons.length ? (
              <CompositionBar
                label="Komposisi alasan selisih"
                parts={s.reasons.map((r) => ({
                  key: r.code,
                  label: r.label,
                  count: r.count,
                  color: REASONS.find((x) => x.code === r.code)?.color ?? 'ser1',
                  value: <SignedValue value={r.value} currency />,
                }))}
              />
            ) : (
              <p className="text-note text-muted-foreground">
                Tidak ada selisih dalam rentang ini.
              </p>
            )}
          </ChartPanel>
        </div>
      )}
    </ChartSection>
  );
};
