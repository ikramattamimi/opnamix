import type { Category } from '@/features/products/types';
import type { RunItem } from './catalog';

export type OpnameStatus = 'belum_dilaksanakan' | 'sedang_dilaksanakan' | 'selesai';

export type PengulanganOpname = 'BULANAN' | 'TRIWULAN' | 'TAHUNAN';

export interface OpnameSchedule {
  id: string;
  nama: string;
  tanggalAudit: number | null; // 1-28
  waktuJam: number | null;
  waktuMenit: number | null;
  pengulangan: PengulanganOpname;
  /** null = tidak dipilih manual */
  obatIds: string[] | null;
  /** null = tidak dibatasi kategori; keduanya null = semua produk */
  kategori: Category[] | null;
  durasiPengerjaan: number | null;
  isActive: boolean | null;
}

export interface OpnameScheduleConfig {
  nama: string;
  pengulangan: PengulanganOpname;
  dayOfMonth: number; // tanggal_audit
  waktuJam: number;
  waktuMenit: number;
  durasiPengerjaan?: number | null;
  obatIds: string[] | null;
  kategori: Category[] | null;
}

/** Satu sesi opname (berjalan atau selesai) beserta produknya */
export interface OpnameRun {
  id: string;
  code: string;
  /** Nama tampil: nama opname cepat, nama jadwal, atau "Opname cepat" */
  name: string;
  status: OpnameStatus;
  scheduleId: string | null;
  scheduleName: string | null;
  startedAt: string;
  completedAt: string | null;
  /** 2 = menghitung, 3 = tinjau selisih */
  step: number;
  auditor: string;
  items: RunItem[];
}

/** Perubahan satu baris hitung. Key yang tidak diisi tidak diubah. */
export interface RunItemUpdate {
  detailId: string;
  physicalStock?: number | null;
  finalStock?: number | null;
  reasonCode?: RunItem['reasonCode'];
  note?: string | null;
}
