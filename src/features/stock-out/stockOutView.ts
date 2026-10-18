import type { StockOutRequest } from './types';

// Logika tampilan daftar Stok Keluar: filter, ringkasan header, dan teks baris.

export type StatusFilter = 'Semua' | StockOutRequest['status'];
export type TypeFilter = 'Semua' | 'Permintaan' | 'Manual';

export const typeLabel = (r: Pick<StockOutRequest, 'tipeSumber'>): Exclude<TypeFilter, 'Semua'> =>
  r.tipeSumber === 'KASIR_LANGSUNG' ? 'Manual' : 'Permintaan';

// Waktu dicatat; data lama tanpa created_at memakai tanggal transaksi
export const requestTime = (r: Pick<StockOutRequest, 'createdAt' | 'date'>) =>
  new Date(r.createdAt || r.date);

export function filterRequests(
  list: readonly StockOutRequest[],
  { status, type, query }: { status: StatusFilter; type: TypeFilter; query: string },
): StockOutRequest[] {
  const q = query.trim().toLocaleLowerCase('id-ID');
  return list.filter(
    (r) =>
      (status === 'Semua' || r.status === status) &&
      (type === 'Semua' || typeLabel(r) === type) &&
      (!q || `${r.patient.fullName} ${r.requestId}`.toLocaleLowerCase('id-ID').includes(q)),
  );
}

const DAY_MS = 864e5;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Angka di header: permintaan menunggu, transaksi hari ini, nilai keluar 7 hari (selesai)
export function stockOutStats(list: readonly StockOutRequest[], now: Date = new Date()) {
  const today = startOfDay(now).getTime();
  const weekStart = today - 6 * DAY_MS;
  let waiting = 0;
  let todayCount = 0;
  let weekTotal = 0;
  for (const r of list) {
    const time = startOfDay(requestTime(r)).getTime();
    if (r.status === 'Menunggu') waiting += 1;
    if (time === today) todayCount += 1;
    if (r.status === 'Selesai' && time >= weekStart && time <= today) {
      weekTotal += r.totalAmount || 0;
    }
  }
  return { waiting, today: todayCount, weekTotal };
}

// "3 obat · 1 jasa"
export function itemSummary(r: Pick<StockOutRequest, 'drugs' | 'services'>): string {
  const parts = [
    r.drugs.length && `${r.drugs.length} obat/BHP`,
    r.services.length && `${r.services.length} jasa`,
  ].filter(Boolean);
  return parts.join(' · ') || 'Tanpa item';
}

// Keterangan yang layak ditampilkan; catatan otomatis dari form permintaan lama disembunyikan
export const visibleNote = (note?: string) =>
  note && note !== '-' && !note.startsWith('Request from Nakes') ? note : '';
