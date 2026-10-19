import React, { useState } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { ChartLegend } from '@/components/charts/ChartLegend';
import { HBarList } from '@/components/charts/HBarList';
import { CompositionBar } from '@/components/charts/CompositionBar';
import { ChartPanel, ChartSection } from '@/components/charts/ChartSection';
import { SignedValue } from '@/components/data/SignedValue';
import { useToast } from '@/components/ui/toast';
import { rpShort, rpSigned } from '@/lib/format';
import { DocExample, DocSection } from '../components/DocSection';

const DAYS = ['13 Okt', '14 Okt', '15 Okt', '16 Okt', '17 Okt', '18 Okt', '19 Okt'];
const MINUS = [-42000, 0, -126500, -8000, 0, -61000, -15500];
const PLUS = [0, 12000, 31000, 0, 0, 4500, 22000];
const IN = [12, 18, 9, 22, 15, 7, 19];
const OUT = [9, 14, 16, 11, 20, 5, 13];

const short = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + rpShort(Math.abs(n));

export const ChartDocs: React.FC = () => {
  const { showToast } = useToast();
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <DocSection
      id="charts"
      title="Grafik"
      description="Komponen SVG ringan tanpa library: BarChart (grouped, atau stacked yang otomatis diverging untuk nilai bertanda), HBarList (batang mendatar berperingkat), CompositionBar (komposisi 100% + legenda), ChartLegend, dan ChartSection/ChartPanel (panel yang bisa diciutkan, status disimpan per perangkat). Warna hanya dari token chart-* (ser1, ser2, minus, plus, r1–r6). Setiap ember bisa difokus dengan Tab, menampilkan tooltip, dan Enter menjalankan onBucketClick. timeBuckets() membagi rentang ke jam/hari/minggu/bulan."
      importPath="import { BarChart } from '@/components/charts/BarChart'; import { timeBuckets } from '@/components/charts/timeBuckets';"
    >
      <DocExample
        title="Diverging (stacked dengan nilai bertanda)"
        note="Klik atau tekan Enter pada batang untuk menyaring rentang."
        code={`
<BarChart
  label="Grafik selisih opname"
  mode="stacked"
  series={[
    { key: 'minus', label: 'Kurang', color: 'minus' },
    { key: 'plus', label: 'Lebih', color: 'plus' },
  ]}
  data={buckets.map((b) => ({ label: b.label, values: { minus: b.minus, plus: b.plus } }))}
  formatValue={rpSigned}
  formatAxis={rpSignedShort}
  onBucketClick={(i) => setRange(buckets[i])}
/>`}
      >
        <div className="w-full">
          <ChartLegend
            items={[
              { label: 'Kurang', color: 'minus' },
              { label: 'Lebih', color: 'plus' },
            ]}
          />
          <BarChart
            label="Contoh grafik selisih"
            mode="stacked"
            series={[
              { key: 'minus', label: 'Kurang', color: 'minus' },
              { key: 'plus', label: 'Lebih', color: 'plus' },
            ]}
            data={DAYS.map((label, i) => ({
              label,
              values: { minus: MINUS[i], plus: PLUS[i] },
              note: `${i % 3} sesi`,
            }))}
            formatValue={rpSigned}
            formatAxis={short}
            onBucketClick={(i) => showToast(`Saring ${DAYS[i]} (contoh).`, 'info')}
          />
        </div>
      </DocExample>

      <DocExample
        title="Grouped"
        code={`<BarChart mode="grouped" series={[{ key: 'in', label: 'Masuk', color: 'ser1' }, { key: 'out', label: 'Keluar', color: 'ser2' }]} data={…} />`}
      >
        <BarChart
          label="Contoh pergerakan stok"
          mode="grouped"
          series={[
            { key: 'in', label: 'Masuk', color: 'ser1' },
            { key: 'out', label: 'Keluar', color: 'ser2' },
          ]}
          data={DAYS.map((label, i) => ({ label, values: { in: IN[i], out: OUT[i] } }))}
        />
      </DocExample>

      <DocExample
        title="ChartSection, HBarList, dan CompositionBar"
        code={`
<ChartSection title="Ringkasan selisih" storageKey="opname-summary" summary="…" controls={<DateRangeControl … />}>
  <ChartPanel title="Selisih terbesar">
    <HBarList items={top.map((t) => ({ id, label, sub, value, display, color: t.value < 0 ? 'minus' : 'plus' }))} onSelect={…} />
  </ChartPanel>
  <ChartPanel title="Alasan selisih" aside="12 produk">
    <CompositionBar label="Komposisi alasan" parts={reasons.map((r) => ({ key, label, count, color, value }))} />
  </ChartPanel>
</ChartSection>`}
      >
        <ChartSection
          title="Ringkasan contoh"
          storageKey="docs-example"
          summary="Ciutkan untuk melihat ringkasan satu baris"
          className="w-full"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <ChartPanel title="Selisih terbesar">
              <HBarList
                onSelect={setPicked}
                items={[
                  {
                    id: 'amox',
                    label: 'Amoxicillin 500 mg',
                    sub: 'Generik',
                    value: -126500,
                    color: 'minus' as const,
                  },
                  {
                    id: 'kasa',
                    label: 'Kasa steril 16 × 16',
                    sub: 'OneMed',
                    value: -42000,
                    color: 'minus' as const,
                  },
                  {
                    id: 'pct',
                    label: 'Paracetamol 500 mg',
                    sub: 'Sanmol',
                    value: 31000,
                    color: 'plus' as const,
                  },
                ].map((t) => ({ ...t, display: <SignedValue value={t.value} currency /> }))}
              />
              {picked && <p className="text-note text-muted-foreground">Dipilih: {picked}</p>}
            </ChartPanel>
            <ChartPanel title="Alasan selisih" aside="9 produk">
              <CompositionBar
                label="Contoh komposisi alasan"
                parts={[
                  {
                    key: 'a',
                    label: 'Transaksi belum dicatat',
                    count: 4,
                    color: 'r1',
                    value: rpSigned(-98000),
                  },
                  { key: 'b', label: 'Rusak', count: 3, color: 'r2', value: rpSigned(-61000) },
                  {
                    key: 'c',
                    label: 'Salah hitung sebelumnya',
                    count: 2,
                    color: 'r4',
                    value: rpSigned(35500),
                  },
                ]}
              />
            </ChartPanel>
          </div>
        </ChartSection>
      </DocExample>
    </DocSection>
  );
};
