import { supabase } from '@/lib/supabaseClient';
import {
  OpnameScheduleConfig,
  OpnameSchedule,
  OpnameStatus,
  OpnameItem,
  PengulanganOpname,
} from './types';
import type { ApiResult } from '@/types/api';
import type { Json } from '@/lib/database.types';
import { getProfileNames } from '@/lib/profiles';
import { getDisplayNameFromMasterObat } from '@/features/products/productDisplay';

// Daftar id obat di kolom jsonb obat_ids / selected_obat_ids. Isinya bisa
// string atau number tergantung asal datanya, jadi pemakai selalu map(String).
type OpnameObatIds = (string | number)[];

type OpnameDetailUpdate = {
  detailId: string;
  physicalStock?: number;
  stokFinal?: number;
  reason?: string;
};

// p_step null berarti current_step tidak diubah. Tipe hasil generate tidak
// menandai argumen RPC yang boleh null, padahal SQL-nya menerima null.
const NO_STEP_CHANGE = null as unknown as number;

// Ubah ke format p_updates RPC save_opname_details. Field yang undefined
// tidak dikirim, sehingga kolomnya tidak diubah di database.
const toOpnameDetailUpdates = (updates?: OpnameDetailUpdate[]) =>
  (updates || []).map((u) => ({
    detail_id: parseInt(u.detailId),
    ...(u.physicalStock !== undefined && { physical_stock: u.physicalStock }),
    ...(u.stokFinal !== undefined && { stok_final: u.stokFinal }),
    ...(u.reason !== undefined && { reason: u.reason }),
  }));

let opnameChannelSeq = 0;

export const opnameApi = {
  // OPNAME SCHEDULES
  createOpnameSchedule: async (config: OpnameScheduleConfig) => {
    const { error } = await supabase.from('opname_schedule').insert({
      nama: config.nama || 'Jadwal Rutin',
      tanggal_audit: config.dayOfMonth,
      waktu_jam: config.waktuJam,
      waktu_menit: config.waktuMenit,
      pengulangan: config.pengulangan,
      obat_ids: config.obatIds || null,
      durasi_pengerjaan: config.durasiPengerjaan || null,
      is_active: true,
    });
    if (error) throw error;
    return { success: true };
  },

  getOpnameSchedules: async (): Promise<OpnameSchedule[]> => {
    const { data, error } = await supabase
      .from('opname_schedule')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((s) => ({
      id: s.id.toString(),
      nama: s.nama,
      tanggalAudit: s.tanggal_audit,
      waktuJam: s.waktu_jam,
      waktuMenit: s.waktu_menit,
      pengulangan: s.pengulangan as PengulanganOpname,
      obatIds: s.obat_ids as string[] | null,
      durasiPengerjaan: s.durasi_pengerjaan,
      isActive: s.is_active,
    }));
  },

  updateOpnameSchedule: async (id: string, config: OpnameScheduleConfig) => {
    const { error } = await supabase
      .from('opname_schedule')
      .update({
        nama: config.nama,
        tanggal_audit: config.dayOfMonth,
        waktu_jam: config.waktuJam,
        waktu_menit: config.waktuMenit,
        pengulangan: config.pengulangan,
        obat_ids: config.obatIds || null,
        durasi_pengerjaan: config.durasiPengerjaan || null,
      })
      .eq('id', parseInt(id));

    if (error) throw error;
    return { success: true };
  },

  deleteOpnameSchedule: async (id: string) => {
    const { error } = await supabase
      .from('opname_schedule')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', parseInt(id));

    if (error) throw error;
  },

  toggleOpnameScheduleStatus: async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('opname_schedule')
      .update({ is_active: isActive })
      .eq('id', parseInt(id));

    if (error) throw error;
  },

  getActiveSchedules: async () => {
    const { data, error } = await supabase
      .from('opname_schedule')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('nama');

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const today = new Date();
    return data.map((schedule) => {
      // tanggal_audit null diteruskan apa adanya (Date memperlakukannya sebagai 0)
      const nextDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        schedule.tanggal_audit as number,
      );
      if (nextDate <= today) {
        if (schedule.pengulangan === 'BULANAN') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (schedule.pengulangan === 'TRIWULAN') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        } else if (schedule.pengulangan === 'TAHUNAN') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
      }
      return {
        nextDate: nextDate.toISOString(),
        pengulangan: schedule.pengulangan,
        nama: schedule.nama,
        scheduleId: schedule.id.toString(),
      };
    });
  },

  // OPNAME EXECUTION
  getUpcomingOpnames: async () => {
    const { data, error } = await supabase
      .from('opname')
      .select(`*, opname_schedule(nama)`)
      .eq('status', 'belum_dilaksanakan')
      .is('deleted_at', null)
      .order('tanggal_jadwal', { ascending: true });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id.toString(),
      opnameNumber: `OPN-${item.id}`,
      scheduleDate: item.tanggal_jadwal,
      status: item.status,
      scheduleName: item.opname_schedule?.nama || 'Jadwal Opname',
      currentStep: item.current_step || 1,
    }));
  },

  getDraftOpnames: async () => {
    const { data, error } = await supabase
      .from('opname')
      .select(`*, opname_schedule(nama)`)
      .eq('status', 'sedang_dilaksanakan')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id.toString(),
      opnameNumber: `OPN-${item.id}`,
      scheduleDate: item.tanggal_jadwal,
      status: item.status,
      scheduleName: item.opname_schedule?.nama || 'Jadwal Opname',
      currentStep: item.current_step || 1,
      createdAt: item.created_at,
    }));
  },

  startOpname: async (scheduleId: string | null, date: string) => {
    // Fetch schedule to get obat_ids if scheduleId is provided
    let selectedObatIds: Json | null = null;

    if (scheduleId) {
      const { data: schedule, error: schedError } = await supabase
        .from('opname_schedule')
        .select('obat_ids')
        .eq('id', parseInt(scheduleId))
        .single();

      if (!schedError && schedule) {
        selectedObatIds = schedule.obat_ids;
      }
    }

    // Create Opname Header WITHOUT details (details created after step 1)
    const { data: opname, error: opError } = await supabase
      .from('opname')
      .insert({
        schedule_id: scheduleId ? parseInt(scheduleId) : null,
        tanggal_jadwal: date,
        status: 'belum_dilaksanakan',
        current_step: 1,
        selected_obat_ids: selectedObatIds, // Pre-select from schedule
      })
      .select('id')
      .single();

    if (opError) throw opError;

    // Create notification for opname creation (to Admin & Nakes)
    await supabase.from('notifications').insert([
      {
        type: 'OPNAME_CREATED',
        title: 'Opname Baru Dibuat',
        message: `Opname OPN-${opname.id} telah dibuat dan menunggu pemilihan obat.`,
        data: { opname_id: opname.id, opname_number: `OPN-${opname.id}`, step: 1 },
        target_role: 'admin',
      },
      {
        type: 'OPNAME_CREATED',
        title: 'Opname Baru Dibuat',
        message: `Opname OPN-${opname.id} telah dibuat dan menunggu pemilihan obat.`,
        data: { opname_id: opname.id, opname_number: `OPN-${opname.id}`, step: 1 },
        target_role: 'farmasi',
      },
    ]);

    return { id: opname.id.toString(), success: true };
  },

  // Complete Step 1: Create detail rows after user confirms product selection
  completeStepOne: async (opnameId: string, selectedProductIds: string[]) => {
    // 1-3. Satu transaksi di database: opname menjadi 'sedang_dilaksanakan'
    // (stok terkunci), lalu detail dibuat dengan snapshot stok terbaru
    const { error: rpcError } = await supabase.rpc('complete_opname_step_one', {
      p_opname_id: parseInt(opnameId),
      p_selected_obat_ids: selectedProductIds,
    });

    if (rpcError) throw new Error(rpcError.message);

    // 4. Create notification for step 1→2 transition
    await supabase.from('notifications').insert([
      {
        type: 'OPNAME_STEP_CHANGED',
        title: 'Opname Dimulai',
        message: `Opname OPN-${opnameId} telah dimulai dan memasuki tahap 2: Input Stok Fisik. Aplikasi terkunci untuk menjaga integritas data.`,
        data: {
          opname_id: parseInt(opnameId),
          opname_number: `OPN-${opnameId}`,
          step: 2,
          product_count: selectedProductIds.length,
        },
        target_role: 'admin',
      },
      {
        type: 'OPNAME_STEP_CHANGED',
        title: 'Opname Dimulai',
        message: `Opname OPN-${opnameId} telah dimulai dan memasuki tahap 2: Input Stok Fisik. Aplikasi terkunci untuk menjaga integritas data.`,
        data: {
          opname_id: parseInt(opnameId),
          opname_number: `OPN-${opnameId}`,
          step: 2,
          product_count: selectedProductIds.length,
        },
        target_role: 'farmasi',
      },
    ]);

    return { success: true };
  },

  // Backward to Step 1: Delete all detail rows and reset to step 1
  backwardToStepOne: async (opnameId: string, scheduleObatIds: string[]) => {
    // Hapus detail dan reset ke step 1 dalam satu transaksi (kunci stok dilepas)
    const { error } = await supabase.rpc('backward_opname_to_step_one', {
      p_opname_id: parseInt(opnameId),
      p_schedule_obat_ids: scheduleObatIds,
    });

    if (error) throw new Error(error.message);

    return { success: true };
  },

  // Get active opname lock status.
  // Stok terkunci selama ada opname 'sedang_dilaksanakan' (semua langkah),
  // sampai opname selesai atau dihapus. Database juga menolak perubahan
  // stok selama itu (assert_no_active_opname), jadi ini hanya untuk UI.
  getActiveOpnameLock: async () => {
    const { data, error } = await supabase
      .from('opname')
      .select('id, current_step, created_at')
      .eq('status', 'sedang_dilaksanakan')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return {
      isLocked: !!data,
      opname: data
        ? {
            id: data.id.toString(),
            opnameNumber: `OPN-${data.id}`,
            currentStep: data.current_step || 1,
            startedAt: data.created_at,
          }
        : null,
    };
  },

  // Dengarkan semua perubahan tabel opname. onSubscribed dipanggil setiap kali
  // channel SUBSCRIBED, termasuk setelah rejoin karena koneksi sempat putus.
  // Mengembalikan fungsi untuk menutup channel.
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

  getOpnameById: async (opnameId: string) => {
    const { data, error } = await supabase
      .from('opname')
      .select(
        `
        *,
        opname_schedule(nama, obat_ids),
        opname_detail(*, master_obat(nama, satuan, jenis, merek, kandungan))
      `,
      )
      .eq('id', parseInt(opnameId))
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    const auditorNames = await getProfileNames([data.created_by]);

    return {
      id: data.id.toString(),
      opnameNumber: `OPN-${data.id}`,
      scheduleDate: data.tanggal_jadwal,
      status: data.status as OpnameStatus,
      auditor: (data.created_by && auditorNames[data.created_by]) || '-',
      currentStep: data.current_step || 1,
      selectedObatIds: data.selected_obat_ids as OpnameObatIds | null,
      completedAt: data.completed_at,
      scheduleObatIds: (data.opname_schedule?.obat_ids as OpnameObatIds | null) || [],
      scheduleName: data.opname_schedule?.nama || 'Jadwal Opname',
      items: (data.opname_detail || []).map((d) => ({
        id: d.id.toString(),
        productId: d.obat_id!.toString(),
        productName: getDisplayNameFromMasterObat(d.master_obat),
        category: d.master_obat?.jenis || 'Obat',
        unit: d.master_obat?.satuan || 'Pcs',
        systemStock: d.stok_sistem,
        physicalStock: d.stok_fisik,
        difference: d.selisih,
        stokFinal: d.stok_final,
        reason: d.alasan,
        detailStatus: d.status as OpnameItem['detailStatus'],
      })),
    };
  },

  saveDraft: async (
    opnameId: string,
    step: number,
    detailUpdates?: {
      detailId: string;
      physicalStock?: number;
      stokFinal?: number;
      reason?: string;
    }[],
  ) => {
    // Step dan semua detail disimpan dalam satu request/transaksi;
    // selisih dihitung di database dari stok_sistem
    const { error } = await supabase.rpc('save_opname_details', {
      p_opname_id: parseInt(opnameId),
      p_step: step,
      p_updates: toOpnameDetailUpdates(detailUpdates),
    });

    if (error) throw new Error(error.message);

    return { success: true };
  },

  // Simpan detail opname TANPA mengubah current_step.
  // Digunakan oleh tombol "Simpan Draft" agar step di DB tidak berubah secara tidak sengaja.
  saveDetailOnly: async (
    opnameId: string,
    detailUpdates: {
      detailId: string;
      physicalStock?: number;
      stokFinal?: number;
      reason?: string;
    }[],
  ) => {
    if (!detailUpdates || detailUpdates.length === 0) return { success: true };

    const { error } = await supabase.rpc('save_opname_details', {
      p_opname_id: parseInt(opnameId),
      p_step: NO_STEP_CHANGE,
      p_updates: toOpnameDetailUpdates(detailUpdates),
    });

    if (error) throw new Error(error.message);

    return { success: true };
  },

  // Update selected products for an opname: update selected_obat_ids, delete existing details, re-create with fresh snapshots
  updateOpnameSelection: async (opnameId: string, selectedProductIds: string[]) => {
    const { error } = await supabase.rpc('update_opname_selection', {
      p_opname_id: parseInt(opnameId),
      p_selected_obat_ids: selectedProductIds,
    });

    if (error) throw new Error(error.message);

    return { success: true };
  },

  deleteOpname: async (opnameId: string) => {
    // Soft delete: mark as deleted instead of removing data
    const { error } = await supabase
      .from('opname')
      .update({ deleted_at: new Date().toISOString(), status: 'dihapus' })
      .eq('id', parseInt(opnameId));

    if (error) throw error;
    return { success: true };
  },

  updateOpnameDetail: async (detailId: string, physicalStock: number) => {
    const { data: detail, error: fetchError } = await supabase
      .from('opname_detail')
      .select('opname_id')
      .eq('id', parseInt(detailId))
      .single();
    if (fetchError) throw fetchError;

    const { error } = await supabase.rpc('save_opname_details', {
      p_opname_id: detail.opname_id!,
      p_step: NO_STEP_CHANGE,
      p_updates: toOpnameDetailUpdates([{ detailId, physicalStock }]),
    });

    if (error) throw new Error(error.message);
  },

  finishOpname: async (opnameId: string) => {
    // Satu transaksi di database: status detail, master_obat.qty, dan
    // status opname berubah bersamaan atau tidak sama sekali.
    const { error } = await supabase.rpc('finish_opname', {
      p_opname_id: parseInt(opnameId),
    });

    if (error) throw new Error(error.message);
  },

  resolveOpnameDifference: async (detailId: string, reason: string) => {
    const { error } = await supabase.rpc('resolve_opname_difference', {
      p_detail_id: parseInt(detailId),
      p_reason: reason,
    });

    if (error) throw new Error(error.message);
  },

  getOpnameHistory: async () => {
    const { data, error } = await supabase
      .from('opname')
      .select(
        `
        *,
        opname_schedule(nama),
        opname_detail (selisih)
      `,
      )
      .eq('status', 'selesai')
      .is('deleted_at', null)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    const auditorNames = await getProfileNames((data || []).map((item) => item.created_by));

    return (data || []).map((item) => ({
      id: item.id.toString(),
      opnameNumber: `OPN-${item.id}`,
      date: item.completed_at || item.created_at,
      scheduleDate: item.tanggal_jadwal,
      scheduleName: item.opname_schedule?.nama || 'Jadwal Opname',
      auditor: (item.created_by && auditorNames[item.created_by]) || '-',
      itemsCount: item.opname_detail?.length || 0,
      discrepancyCount: (item.opname_detail || []).filter((d) => d.selisih !== 0).length,
      status: 'selesai',
    }));
  },

  getOpnameDetailView: async (opnameId: string) => {
    const { data, error } = await supabase
      .from('opname_detail')
      .select(`*, master_obat(nama, satuan, jenis, merek, kandungan)`)
      .eq('opname_id', parseInt(opnameId));

    if (error) throw error;

    return (data || []).map((d) => ({
      id: d.id.toString(),
      productName: getDisplayNameFromMasterObat(d.master_obat),
      stokSistem: d.stok_sistem,
      stokFisik: d.stok_fisik,
      selisih: d.selisih,
      stokFinal: d.stok_final,
      alasan: d.alasan || '-',
    }));
  },
};

export type OpnameDetail = ApiResult<typeof opnameApi.getOpnameById>;
export type OpnameDetailViewRow = ApiResult<typeof opnameApi.getOpnameDetailView>[number];
