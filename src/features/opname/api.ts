import { supabase } from '@/lib/supabaseClient';
import type { Json, Tables } from '@/lib/database.types';
import { getProfileNames } from '@/lib/profiles';
import { mapProductFromDB, type ProductRow } from '@/features/products/mappers';
import type { Category } from '@/features/products/types';
import { isReasonCode, opnameCode, reasonMeta, runName, type RunItem } from './catalog';
import type {
  OpnameRun,
  OpnameSchedule,
  OpnameScheduleConfig,
  OpnameStatus,
  PengulanganOpname,
  RunItemUpdate,
} from './types';

// p_step null berarti current_step tidak diubah. Tipe hasil generate tidak
// menandai argumen RPC yang boleh null, padahal SQL-nya menerima null.
const NO_STEP_CHANGE = null as unknown as number;

const RUN_SELECT = `
  id, nama, status, schedule_id, created_at, completed_at, current_step, created_by,
  opname_schedule(nama),
  opname_detail(id, obat_id, stok_sistem, stok_fisik, stok_final, alasan, alasan_kode, catatan,
    master_obat(*, product_ingredients(nama_zat, kekuatan, urutan)))
`;

type DetailRow = Pick<
  Tables<'opname_detail'>,
  | 'id'
  | 'obat_id'
  | 'stok_sistem'
  | 'stok_fisik'
  | 'stok_final'
  | 'alasan'
  | 'alasan_kode'
  | 'catatan'
> & { master_obat: ProductRow | null };

type RunRow = Pick<
  Tables<'opname'>,
  | 'id'
  | 'nama'
  | 'status'
  | 'schedule_id'
  | 'created_at'
  | 'completed_at'
  | 'current_step'
  | 'created_by'
> & { opname_schedule: { nama: string } | null; opname_detail: DetailRow[] | null };

const mapItem = (d: DetailRow): RunItem | null => {
  if (!d.master_obat) return null;
  return {
    detailId: d.id.toString(),
    product: mapProductFromDB(d.master_obat),
    systemStock: d.stok_sistem ?? 0,
    physicalStock: d.stok_fisik,
    // stok_final sama dengan fisik bukan penyesuaian lanjutan
    finalStock: d.stok_final !== null && d.stok_final !== d.stok_fisik ? d.stok_final : null,
    reasonCode: isReasonCode(d.alasan_kode) ? d.alasan_kode : null,
    reasonText: d.alasan_kode ? null : d.alasan,
    note: d.catatan,
  };
};

const mapRun = (row: RunRow, auditors: Record<string, string>): OpnameRun => {
  const scheduleName = row.opname_schedule?.nama ?? null;
  return {
    id: row.id.toString(),
    code: opnameCode(row.id),
    name: runName({ name: row.nama, scheduleName: row.schedule_id ? scheduleName : null }),
    status: row.status as OpnameStatus,
    scheduleId: row.schedule_id?.toString() ?? null,
    scheduleName,
    startedAt: row.created_at ?? new Date().toISOString(),
    completedAt: row.completed_at,
    step: row.current_step ?? 2,
    auditor: (row.created_by && auditors[row.created_by]) || '-',
    items: (row.opname_detail ?? [])
      .map(mapItem)
      .filter((i): i is RunItem => i !== null)
      .sort((a, b) => a.product.name.localeCompare(b.product.name, 'id-ID')),
  };
};

const mapRuns = async (rows: RunRow[]) => {
  const auditors = await getProfileNames(rows.map((r) => r.created_by));
  return rows.map((r) => mapRun(r, auditors));
};

const toDetailUpdates = (updates: RunItemUpdate[]) =>
  updates.map((u) => ({
    detail_id: Number(u.detailId),
    ...(u.physicalStock !== undefined && { physical_stock: u.physicalStock }),
    ...(u.finalStock !== undefined && { stok_final: u.finalStock }),
    ...(u.reasonCode !== undefined && {
      reason_code: u.reasonCode ?? '',
      // Kolom alasan tetap diisi label untuk laporan mutasi
      reason: u.reasonCode ? reasonMeta(u.reasonCode).label : null,
    }),
    ...(u.note !== undefined && { note: u.note ?? '' }),
  }));

const scheduleFields = (config: OpnameScheduleConfig) => ({
  nama: config.nama.trim(),
  tanggal_audit: config.dayOfMonth,
  waktu_jam: config.waktuJam,
  waktu_menit: config.waktuMenit,
  pengulangan: config.pengulangan,
  obat_ids: config.obatIds,
  kategori: config.kategori,
  durasi_pengerjaan: config.durasiPengerjaan ?? null,
});

let opnameChannelSeq = 0;

export const opnameApi = {
  // ---- Jadwal ----
  getSchedules: async (): Promise<OpnameSchedule[]> => {
    const { data, error } = await supabase
      .from('opname_schedule')
      .select('*')
      .is('deleted_at', null)
      .order('nama');
    if (error) throw error;
    return (data ?? []).map((s) => ({
      id: s.id.toString(),
      nama: s.nama,
      tanggalAudit: s.tanggal_audit,
      waktuJam: s.waktu_jam,
      waktuMenit: s.waktu_menit,
      pengulangan: (s.pengulangan as PengulanganOpname) || 'BULANAN',
      obatIds: Array.isArray(s.obat_ids) ? s.obat_ids.map(String) : null,
      kategori: Array.isArray(s.kategori) ? (s.kategori as Category[]) : null,
      durasiPengerjaan: s.durasi_pengerjaan,
      isActive: s.is_active,
    }));
  },

  createSchedule: async (config: OpnameScheduleConfig) => {
    const { error } = await supabase
      .from('opname_schedule')
      .insert({ ...scheduleFields(config), is_active: true });
    if (error) throw error;
  },

  updateSchedule: async (id: string, config: OpnameScheduleConfig) => {
    const { error } = await supabase
      .from('opname_schedule')
      .update(scheduleFields(config))
      .eq('id', Number(id));
    if (error) throw error;
  },

  // Hapus lunak: riwayat opname dari jadwal ini tetap tersimpan
  deleteSchedule: async (id: string) => {
    const { error } = await supabase
      .from('opname_schedule')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', Number(id));
    if (error) throw error;
  },

  toggleSchedule: async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('opname_schedule')
      .update({ is_active: isActive })
      .eq('id', Number(id));
    if (error) throw error;
  },

  // ---- Sesi opname ----

  /** Opname berjalan (terbaru dulu) atau selesai (selesai terbaru dulu) */
  listRuns: async (status: 'sedang_dilaksanakan' | 'selesai'): Promise<OpnameRun[]> => {
    const { data, error } = await supabase
      .from('opname')
      .select(RUN_SELECT)
      .eq('status', status)
      .is('deleted_at', null)
      .order(status === 'selesai' ? 'completed_at' : 'created_at', { ascending: false });
    if (error) throw error;
    return mapRuns((data ?? []) as unknown as RunRow[]);
  },

  getRun: async (id: string): Promise<OpnameRun> => {
    const { data, error } = await supabase
      .from('opname')
      .select(RUN_SELECT)
      .eq('id', Number(id))
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    const [run] = await mapRuns([data as unknown as RunRow]);
    return run;
  },

  /** Buat opname + detail dan langsung kunci produknya. Mengembalikan id. */
  startRun: async (input: {
    name: string;
    scheduleId: string | null;
    productIds: string[];
  }): Promise<string> => {
    const { data, error } = await supabase.rpc('start_opname', {
      p_nama: input.name,
      p_schedule_id: input.scheduleId ? Number(input.scheduleId) : null,
      p_obat_ids: input.productIds as unknown as Json,
    });
    if (error) throw new Error(error.message);
    return String(data);
  },

  /** Simpan hitungan/alasan; `step` 3 = masuk tinjau selisih */
  saveItems: async (opnameId: string, updates: RunItemUpdate[], step?: 2 | 3) => {
    const { error } = await supabase.rpc('save_opname_details', {
      p_opname_id: Number(opnameId),
      p_step: step ?? NO_STEP_CHANGE,
      p_updates: toDetailUpdates(updates) as unknown as Json,
    });
    if (error) throw new Error(error.message);
  },

  finishRun: async (opnameId: string) => {
    const { error } = await supabase.rpc('finish_opname', { p_opname_id: Number(opnameId) });
    if (error) throw new Error(error.message);
  },

  /** Batalkan opname berjalan: hitungan dibuang dan kunci produk dibuka */
  cancelRun: async (opnameId: string) => {
    const { error } = await supabase
      .from('opname')
      .update({ deleted_at: new Date().toISOString(), status: 'dihapus' })
      .eq('id', Number(opnameId))
      .eq('status', 'sedang_dilaksanakan');
    if (error) throw error;
  },

  // Dengarkan semua perubahan tabel opname. onSubscribed dipanggil setiap kali
  // channel SUBSCRIBED, termasuk setelah rejoin karena koneksi sempat putus.
  subscribeToOpnameChanges: (handlers: { onChange: () => void; onSubscribed: () => void }) => {
    // Nama unik per langganan: supabase.channel() mengembalikan channel lama
    // kalau topiknya sama, padahal channel itu mungkin sedang ditutup.
    const channel = supabase
      .channel(`opname-changes-${++opnameChannelSeq}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opname' }, handlers.onChange)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') handlers.onSubscribed();
      });
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
