import { toDate } from '@/lib/utils';

export interface ScheduleInfo {
  nextDate: string;
  pengulangan: string | null;
  nama: string;
  scheduleId: string;
}

export interface OpnameCard {
  id: string;
  opnameNumber: string;
  scheduleDate: string | null;
  status: string | null;
  scheduleName: string;
  currentStep?: number;
  date?: string | null;
  itemsCount?: number;
  discrepancyCount?: number;
  createdAt?: string | null;
}

export const formatDate = (dateStr: string | null) =>
  toDate(dateStr).toLocaleDateString('id-ID', { dateStyle: 'long' });

export const pengulanganLabel: Record<string, string> = {
  BULANAN: 'Setiap Bulan',
  TRIWULAN: 'Setiap 3 Bulan',
  TAHUNAN: 'Setiap Tahun',
};

export const stepLabel: Record<number, string> = {
  1: 'Pemilihan Obat',
  2: 'Input Stok Fisik',
  3: 'Penyesuaian Stok',
};

// Cocokkan nama jadwal atau nomor opname dengan kata kunci pencarian
export const filterOpnames = (cards: OpnameCard[], search: string) => {
  if (!search.trim()) return cards;
  const q = search.toLowerCase();
  return cards.filter(
    (c) => c.scheduleName.toLowerCase().includes(q) || c.opnameNumber.toLowerCase().includes(q),
  );
};
