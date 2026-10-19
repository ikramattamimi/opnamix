import { bucketIndex, timeBuckets, type TimeBucket } from '@/components/charts/timeBuckets';
import { REASONS, diffOf, hasReason, valueOf, type ReasonCode, type RunItem } from './catalog';
import type { OpnameRun } from './types';

// Ringkasan selisih opname selesai dalam satu rentang waktu: angka utama,
// selisih per ember waktu, produk selisih terbesar, dan komposisi alasan.

export interface BucketTotals extends TimeBucket {
  minus: number;
  plus: number;
  sessions: number;
}

export interface TopProduct {
  productId: string;
  item: RunItem;
  value: number;
}

export interface ReasonTotal {
  code: ReasonCode | 'lama';
  label: string;
  count: number;
  value: number;
}

export interface OpnameSummaryData {
  runs: OpnameRun[];
  counted: number;
  diffs: number;
  minusCount: number;
  plusCount: number;
  minus: number;
  plus: number;
  net: number;
  /** 0–100, null kalau tidak ada produk dihitung */
  accuracy: number | null;
  buckets: BucketTotals[];
  top: TopProduct[];
  reasons: ReasonTotal[];
}

const completedDate = (r: OpnameRun) => new Date(r.completedAt ?? r.startedAt);

export function inRange(run: OpnameRun, from: Date, to: Date) {
  const d = completedDate(run).getTime();
  return d >= from.getTime() && d <= to.getTime();
}

export function summarizeOpnames(
  history: readonly OpnameRun[],
  from: Date,
  to: Date,
  topCount = 5,
): OpnameSummaryData {
  const runs = history.filter((r) => inRange(r, from, to));
  const buckets: BucketTotals[] = timeBuckets(from, to).map((b) => ({
    ...b,
    minus: 0,
    plus: 0,
    sessions: 0,
  }));
  const byProduct = new Map<string, TopProduct>();
  const reasons = new Map<string, ReasonTotal>();
  const s = { counted: 0, diffs: 0, minusCount: 0, plusCount: 0, minus: 0, plus: 0 };

  for (const run of runs) {
    const bucket = buckets[bucketIndex(buckets, completedDate(run))];
    if (bucket) bucket.sessions++;
    for (const item of run.items) {
      const d = diffOf(item);
      if (d === null) continue;
      s.counted++;
      if (d === 0) continue;
      s.diffs++;
      const v = valueOf(item);
      if (d < 0) {
        s.minusCount++;
        s.minus += v;
        if (bucket) bucket.minus += v;
      } else {
        s.plusCount++;
        s.plus += v;
        if (bucket) bucket.plus += v;
      }

      const top = byProduct.get(item.product.id);
      byProduct.set(item.product.id, {
        productId: item.product.id,
        item,
        value: (top?.value ?? 0) + v,
      });

      if (hasReason(item)) {
        const meta = item.reasonCode ? REASONS.find((r) => r.code === item.reasonCode) : null;
        const key = meta?.code ?? 'lama';
        const prev = reasons.get(key);
        reasons.set(key, {
          code: key,
          label: meta?.label ?? 'Alasan lama (teks)',
          count: (prev?.count ?? 0) + 1,
          value: (prev?.value ?? 0) + v,
        });
      }
    }
  }

  const order = (code: string) => {
    const i = REASONS.findIndex((r) => r.code === code);
    return i === -1 ? REASONS.length : i;
  };

  return {
    runs,
    ...s,
    net: s.minus + s.plus,
    accuracy: s.counted ? ((s.counted - s.diffs) / s.counted) * 100 : null,
    buckets,
    top: [...byProduct.values()]
      .filter((t) => t.value !== 0)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, topCount),
    reasons: [...reasons.values()].sort((a, b) => order(a.code) - order(b.code)),
  };
}

/** Tanggal opname terakhir per produk (untuk filter "belum diopname > 30 hari") */
export function lastOpnamedAt(history: readonly OpnameRun[]): Map<string, Date> {
  const map = new Map<string, Date>();
  for (const run of history) {
    const d = completedDate(run);
    for (const item of run.items) {
      const prev = map.get(item.product.id);
      if (!prev || prev < d) map.set(item.product.id, d);
    }
  }
  return map;
}
