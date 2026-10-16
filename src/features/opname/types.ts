export type OpnameStatus = 'belum_dilaksanakan' | 'sedang_dilaksanakan' | 'selesai';

export interface OpnameItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  unit: string;
  systemStock: number | null;
  physicalStock?: number | null;
  difference?: number | null;
  stokFinal?: number | null;
  reason?: string | null;
  detailStatus?: 'pending' | 'sesuai' | 'disesuaikan';
}

export interface StockOpname {
  id: string;
  opnameNumber: string;
  scheduleDate: string; // tanggal_jadwal
  status: OpnameStatus;
  auditor: string;
  currentStep: number; // 1, 2, or 3
  selectedObatIds?: string[];
  completedAt?: string;
  scheduleName?: string; // from opname_schedule.nama
  items: OpnameItem[];
}

export type PengulanganOpname = 'BULANAN' | 'TRIWULAN' | 'TAHUNAN';

export interface OpnameSchedule {
  id: string;
  nama: string;
  tanggalAudit: number | null; // 1-28
  waktuJam: number | null;
  waktuMenit: number | null;
  pengulangan: PengulanganOpname;
  obatIds: string[] | null; // null = semua obat
  durasiPengerjaan: number | null;
  isActive: boolean | null;
}

export interface OpnameScheduleConfig {
  nama?: string;
  pengulangan: PengulanganOpname;
  dayOfMonth: number; // tanggal_audit
  waktuJam: number;
  waktuMenit: number;
  durasiPengerjaan?: number;
  obatIds?: string[] | null;
}
