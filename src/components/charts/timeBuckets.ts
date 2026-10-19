import { monthName } from '@/lib/format';

// Bagi rentang waktu ke ember hari / minggu / bulan untuk grafik waktu.
// Rentang ≤ 14 hari per hari, ≤ 62 hari per minggu, selebihnya per bulan.

export type BucketUnit = 'hour' | 'day' | 'week' | 'month';

export interface TimeBucket {
  start: Date;
  end: Date;
  label: string;
}

const DAY = 864e5;
const short = (d: Date) => monthName(d.getMonth()).slice(0, 3);

export function bucketUnit(from: Date, to: Date): BucketUnit {
  const span = (to.getTime() - from.getTime()) / DAY;
  if (span <= 1.01) return 'hour';
  if (span <= 14) return 'day';
  if (span <= 62) return 'week';
  return 'month';
}

export const BUCKET_UNIT_LABEL: Record<BucketUnit, string> = {
  hour: 'jam',
  day: 'hari',
  week: 'minggu',
  month: 'bulan',
};

export function timeBuckets(from: Date, to: Date, unit = bucketUnit(from, to)): TimeBucket[] {
  const out: TimeBucket[] = [];
  let cur =
    unit === 'month'
      ? new Date(from.getFullYear(), from.getMonth(), 1)
      : unit === 'hour'
        ? new Date(from.getFullYear(), from.getMonth(), from.getDate(), from.getHours())
        : new Date(from.getFullYear(), from.getMonth(), from.getDate());
  // Batas aman supaya rentang yang salah tidak membuat ribuan ember
  for (let guard = 0; cur <= to && guard < 400; guard++) {
    const next =
      unit === 'hour'
        ? new Date(cur.getTime() + 36e5)
        : unit === 'day'
          ? new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1)
          : unit === 'week'
            ? new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 7)
            : new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    const start = new Date(Math.max(cur.getTime(), from.getTime()));
    const end = new Date(Math.min(next.getTime() - 1, to.getTime()));
    let label: string;
    if (unit === 'hour') label = `${String(start.getHours()).padStart(2, '0')}.00`;
    else if (unit === 'day') label = `${start.getDate()} ${short(start)}`;
    else if (unit === 'week')
      label =
        start.getMonth() === end.getMonth()
          ? `${start.getDate()}–${end.getDate()} ${short(end)}`
          : `${start.getDate()} ${short(start)}–${end.getDate()} ${short(end)}`;
    else
      label =
        short(start) + (start.getMonth() === 0 ? ` ${String(start.getFullYear()).slice(2)}` : '');
    out.push({ start, end, label });
    cur = next;
  }
  return out;
}

/** Indeks ember yang memuat tanggal, atau -1 */
export function bucketIndex(buckets: TimeBucket[], date: Date): number {
  const t = date.getTime();
  return buckets.findIndex((b) => t >= b.start.getTime() && t <= b.end.getTime());
}
