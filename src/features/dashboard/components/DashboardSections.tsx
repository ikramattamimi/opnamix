import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BarChart } from '@/components/charts/BarChart';
import { ChartLegend } from '@/components/charts/ChartLegend';
import { CompositionBar } from '@/components/charts/CompositionBar';
import { HBarList } from '@/components/charts/HBarList';
import { KpiStrip } from '@/components/data/KpiStrip';
import { ListRow } from '@/components/data/ListRow';
import { StatusChip } from '@/components/data/StatusChip';
import { ToneIcon, type Tone } from '@/components/data/ToneIcon';
import { LineItems } from '@/components/panel/LineItems';
import { Timeline, type TimelineItem } from '@/components/panel/Timeline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { rp, rpShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CATEGORY_META } from '@/features/products/catalog';
import type { Product } from '@/features/products/types';
import { formatExpiry } from '@/features/stock-in/expiry';
import { positionSummary, valueByCategory, type ValueBucket } from '@/features/reports/reportView';
import type { ExpiringBatch } from '@/features/reports/types';

// Kartu-kartu Dashboard. Halaman hanya menyiapkan data dan aksi.

export const DashCard: React.FC<{
  title: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, aside, children, className }) => (
  <Card className={cn('flex min-w-0 flex-col gap-3 p-3.5', className)}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-panel font-bold">{title}</h2>
      {aside}
    </div>
    {children}
  </Card>
);

export interface DashTask {
  key: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  subtitle: string;
  meta?: string;
  action: string;
  primary?: boolean;
  onAction: () => void;
}

const VISIBLE_TASKS = 7;

export const TasksCard: React.FC<{ tasks: DashTask[] }> = ({ tasks }) => {
  const [all, setAll] = useState(false);
  const shown = all ? tasks : tasks.slice(0, VISIBLE_TASKS);
  return (
    <DashCard
      title={
        <>
          Perlu tindakan
          {tasks.length > 0 && <StatusChip tone="warn">{tasks.length}</StatusChip>}
        </>
      }
      aside={<span className="text-note text-muted-foreground">Paling mendesak di atas</span>}
    >
      {tasks.length === 0 ? (
        <p className="text-note text-muted-foreground">Tidak ada yang menunggu. Semua beres.</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {shown.map((t) => (
            <ListRow
              key={t.key}
              compact
              lead={<ToneIcon icon={t.icon} tone={t.tone} />}
              title={t.title}
              subtitle={t.subtitle}
              value={
                t.meta && (
                  <span className="text-xs font-normal text-muted-foreground">{t.meta}</span>
                )
              }
              status={
                <Button size="sm" variant={t.primary ? 'default' : 'outline'} onClick={t.onAction}>
                  {t.action}
                </Button>
              }
            />
          ))}
        </div>
      )}
      {tasks.length > VISIBLE_TASKS && (
        <Button
          variant="link"
          size="sm"
          className="h-auto self-start px-0"
          onClick={() => setAll(!all)}
        >
          {all ? 'Tampilkan lebih sedikit' : `Tampilkan semua (${tasks.length})`}
        </Button>
      )}
    </DashCard>
  );
};

export const MovementCard: React.FC<{
  buckets: ValueBucket[];
  inCount: number;
  outCount: number;
  loading?: boolean;
}> = ({ buckets, inCount, outCount }) => {
  const inValue = buckets.reduce((s, b) => s + b.a, 0);
  const outValue = buckets.reduce((s, b) => s + b.b, 0);
  return (
    <DashCard
      title="Pergerakan stok 7 hari"
      aside={
        <ChartLegend
          items={[
            { label: 'Masuk', color: 'ser1' },
            { label: 'Keluar', color: 'ser2' },
          ]}
        />
      }
    >
      <KpiStrip
        items={[
          {
            label: 'Masuk',
            swatch: 'bg-chart-ser1',
            value: rp(inValue),
            note: `${inCount} penerimaan`,
          },
          {
            label: 'Keluar',
            swatch: 'bg-chart-ser2',
            value: rp(outValue),
            note: `${outCount} transaksi`,
          },
          {
            label: 'Rata-rata keluar per hari',
            value: rp(outValue / Math.max(1, buckets.length)),
            note: 'dinilai dengan harga beli',
          },
        ]}
      />
      <BarChart
        label="Grafik nilai stok masuk dan keluar 7 hari terakhir"
        series={[
          { key: 'in', label: 'Masuk', color: 'ser1' },
          { key: 'out', label: 'Keluar', color: 'ser2' },
        ]}
        data={buckets.map((b) => ({ label: b.label, values: { in: b.a, out: b.b } }))}
        formatValue={rp}
        formatAxis={rpShort}
        height={180}
      />
    </DashCard>
  );
};

export interface TodayEvent extends TimelineItem {
  time: Date;
}

const clock = (d: Date) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export const TodayCard: React.FC<{
  events: TodayEvent[];
  upcoming: { id: string; title: string; subtitle: string }[];
  moreLabel?: React.ReactNode;
}> = ({ events, upcoming, moreLabel }) => {
  const now = new Date();
  return (
    <DashCard
      title="Hari ini"
      aside={
        <span className="text-note text-muted-foreground">
          {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      }
    >
      {events.length ? (
        <Timeline
          items={events.map((e) => ({
            ...e,
            title: (
              <>
                <span className="mr-1.5 tabular-nums text-muted-foreground">{clock(e.time)}</span>
                {e.title}
              </>
            ),
          }))}
        />
      ) : (
        <p className="text-note text-muted-foreground">Belum ada aktivitas hari ini.</p>
      )}
      {moreLabel}
      {upcoming.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <span className="text-xs font-semibold text-muted-foreground">Akan datang</span>
          <Timeline items={upcoming.map((u) => ({ ...u, tone: 'neutral' as const }))} />
        </div>
      )}
    </DashCard>
  );
};

export const StockHealthCard: React.FC<{ products: Product[]; onOpenReport?: () => void }> = ({
  products,
  onOpenReport,
}) => {
  const s = positionSummary(products);
  const cats = valueByCategory(products);
  return (
    <DashCard
      title="Kondisi stok"
      aside={
        onOpenReport && (
          <Button variant="link" size="sm" className="h-auto px-0" onClick={onOpenReport}>
            Laporan stok
          </Button>
        )
      }
    >
      <KpiStrip
        items={[
          { label: 'Nilai persediaan', value: rp(s.value), note: `${s.count} produk · harga beli` },
        ]}
      />
      <CompositionBar
        label="Status stok"
        countSuffix=" produk"
        parts={[
          { key: 'aman', label: 'Aman', count: s.aman, color: 'ok' },
          { key: 'menipis', label: 'Menipis', count: s.menipis, color: 'warn' },
          { key: 'habis', label: 'Habis', count: s.habis, color: 'bad' },
        ]}
      />
      <div className="flex flex-col gap-2 border-t pt-3">
        <span className="text-xs font-semibold text-muted-foreground">Per kategori</span>
        <HBarList
          ranked={false}
          items={cats.map((c) => ({
            id: c.category,
            label: CATEGORY_META[c.category].short,
            sub: `${c.count} produk`,
            value: c.value,
            display: rpShort(c.value),
            color: CATEGORY_META[c.category].tone,
          }))}
        />
      </div>
    </DashCard>
  );
};

const monthsLeft = (iso: string) =>
  Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / (30.4 * 864e5)));

export const ExpiringCard: React.FC<{ batches: ExpiringBatch[] }> = ({ batches }) => (
  <DashCard
    title="Kedaluwarsa mendekat"
    aside={<span className="text-note text-muted-foreground">6 bulan</span>}
  >
    {batches.length ? (
      <LineItems
        items={batches.slice(0, 5).map((b) => {
          const m = monthsLeft(b.expireDate);
          return {
            id: b.key,
            title: b.product.name,
            subtitle: `${b.product.brand || 'Generik'}${b.batch ? ` · batch ${b.batch}` : ''} · ${formatExpiry(b.expireDate)}`,
            amount: (
              <StatusChip tone={m < 3 ? 'bad' : 'warn'}>
                {new Date(b.expireDate) < new Date()
                  ? 'Lewat'
                  : m < 1
                    ? '< 1 bln'
                    : `${m} bln lagi`}
              </StatusChip>
            ),
          };
        })}
      />
    ) : (
      <p className="text-note text-muted-foreground">
        Tidak ada batch yang kedaluwarsa dalam 6 bulan.
      </p>
    )}
  </DashCard>
);
