import { monthName } from '@/lib/format';

// Rentang tanggal dari preset (Hari ini, 7/30 hari, bulan ini) atau kustom.

export type DatePreset = 'today' | '7' | '30' | '90' | '365' | 'month' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const shortDate = (d: Date) =>
  `${d.getDate()} ${monthName(d.getMonth()).slice(0, 3)} ${d.getFullYear()}`;

export function resolveDateRange(
  preset: DatePreset,
  custom: { from: string; to: string },
  now: Date = new Date(),
): DateRange {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (preset === 'custom') {
    let from = new Date(`${custom.from}T00:00:00`);
    let to = new Date(`${custom.to}T23:59:59.999`);
    if (Number.isNaN(from.getTime()))
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (Number.isNaN(to.getTime())) to = end;
    if (from > to)
      [from, to] = [new Date(`${isoDay(to)}T00:00:00`), new Date(`${isoDay(from)}T23:59:59.999`)];
    const label =
      isoDay(from) === isoDay(to)
        ? shortDate(from)
        : `${from.getDate()} ${monthName(from.getMonth()).slice(0, 3)} – ${shortDate(to)}`;
    return { from, to, label };
  }
  if (preset === 'today') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      to: end,
      label: 'Hari ini',
    };
  }
  if (preset === 'month') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: end,
      label: `${monthName(now.getMonth())} ${now.getFullYear()}`,
    };
  }
  const days = Number(preset);
  return {
    from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1),
    to: end,
    label: `${days} hari terakhir`,
  };
}
