import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateOpnameChange } from '@/lib/invalidate';
import { createNotification } from '@/features/notifications/api';
import { opnameApi } from './api';
import { opnameKeys } from './keys';
import { runStats } from './catalog';
import type { OpnameRun, OpnameScheduleConfig, RunItemUpdate } from './types';

// ---- Jadwal ----

export function useOpnameSchedules() {
  return useQuery({ queryKey: opnameKeys.schedules(), queryFn: opnameApi.getSchedules });
}

// Jadwal tidak mengubah status opname maupun stok, jadi cukup refresh jadwal
function useScheduleMutation<T>(fn: (input: T) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: opnameKeys.schedules() }),
  });
}

export const useSaveOpnameSchedule = () =>
  useScheduleMutation(({ id, config }: { id?: string; config: OpnameScheduleConfig }) =>
    id ? opnameApi.updateSchedule(id, config) : opnameApi.createSchedule(config),
  );
export const useDeleteOpnameSchedule = () => useScheduleMutation(opnameApi.deleteSchedule);
export const useToggleOpnameSchedule = () =>
  useScheduleMutation(({ id, isActive }: { id: string; isActive: boolean }) =>
    opnameApi.toggleSchedule(id, isActive),
  );

// ---- Sesi ----

export function useActiveOpnames() {
  return useQuery({
    queryKey: opnameKeys.active(),
    queryFn: () => opnameApi.listRuns('sedang_dilaksanakan'),
    // Opname bisa dimulai/selesai dari perangkat lain
    refetchOnWindowFocus: 'always',
  });
}

export function useOpnameHistory() {
  return useQuery({
    queryKey: opnameKeys.history(),
    queryFn: () => opnameApi.listRuns('selesai'),
  });
}

export function useOpnameRun(id: string | undefined) {
  return useQuery({
    queryKey: opnameKeys.run(id ?? ''),
    queryFn: () => opnameApi.getRun(id!),
    enabled: !!id,
  });
}

// Perubahan tabel opname dari perangkat lain → refresh daftar sesi.
// Hitungan di layar kerja tidak ikut di-refresh supaya isian tidak tertimpa.
export function useOpnameRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: opnameKeys.active() });
      void queryClient.invalidateQueries({ queryKey: opnameKeys.history() });
    };
    let subscribed = false;
    return opnameApi.subscribeToOpnameChanges({
      onChange: refresh,
      onSubscribed: () => {
        // SUBSCRIBED berikutnya berarti reconnect: event selama putus hilang
        if (subscribed) refresh();
        subscribed = true;
      },
    });
  }, [queryClient]);
}

const OPNAME_NOTIFICATION_ROLES = ['admin', 'apoteker', 'farmasi'];

// Gagal mengirim notifikasi tidak menggagalkan mutasi yang sudah berhasil
const notifyOpname = async (
  notification: Omit<Parameters<typeof createNotification>[0], 'target_roles'>,
) => {
  try {
    await createNotification({ ...notification, target_roles: OPNAME_NOTIFICATION_ROLES });
  } catch (error) {
    console.error('Failed to create opname notification:', error);
  }
};

export function useStartOpname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: opnameApi.startRun,
    onSuccess: async (id, input) => {
      await invalidateOpnameChange(queryClient);
      await notifyOpname({
        type: 'OPNAME_STARTED',
        title: 'Opname dimulai',
        message: `${input.name || 'Opname cepat'}: ${input.productIds.length} produk dikunci dari transaksi sementara.`,
        data: { opname_id: Number(id), opname_number: `OPN-${id}` },
      });
    },
  });
}

export function useFinishOpname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (run: OpnameRun) => opnameApi.finishRun(run.id),
    onSuccess: async (_data, run) => {
      await invalidateOpnameChange(queryClient);
      const s = runStats(run.items);
      await notifyOpname({
        type: 'OPNAME_COMPLETED',
        title: `${run.name} selesai`,
        message: `${s.n} produk dihitung, ${s.diff} produk selisih. Stok sudah disesuaikan.`,
        data: { opname_id: Number(run.id), opname_number: run.code },
      });
    },
  });
}

export function useCancelOpname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opnameApi.cancelRun(id),
    onSuccess: () => invalidateOpnameChange(queryClient),
  });
}

/** Pindah antara hitung (2) dan tinjau (3) */
export function useSetOpnameStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, step }: { id: string; step: 2 | 3 }) => opnameApi.saveItems(id, [], step),
    onSuccess: (_d, { id }) => queryClient.invalidateQueries({ queryKey: opnameKeys.run(id) }),
  });
}

// ---- Simpan otomatis ----

const applyUpdate = (run: OpnameRun, u: RunItemUpdate): OpnameRun => ({
  ...run,
  items: run.items.map((i) =>
    i.detailId !== u.detailId
      ? i
      : {
          ...i,
          ...(u.physicalStock !== undefined && {
            physicalStock: u.physicalStock,
            // Hitung ulang membuang stok final lanjutan (sama seperti di database)
            finalStock: u.finalStock !== undefined ? u.finalStock : null,
          }),
          ...(u.physicalStock === undefined &&
            u.finalStock !== undefined && { finalStock: u.finalStock }),
          ...(u.reasonCode !== undefined && { reasonCode: u.reasonCode, reasonText: null }),
          ...(u.note !== undefined && { note: u.note }),
        },
  ),
});

/**
 * Perubahan hitungan langsung tampil (cache diubah), lalu dikirim sekaligus
 * setelah jeda pengetikan. Perubahan beruntun di baris yang sama digabung.
 */
export function useAutosaveRun(runId: string | undefined, delay = 700) {
  const queryClient = useQueryClient();
  const pending = useRef(new Map<string, RunItemUpdate>());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flush = useCallback(async () => {
    if (!runId || pending.current.size === 0) return;
    const batch = [...pending.current.values()];
    pending.current.clear();
    setSaving(true);
    try {
      await opnameApi.saveItems(runId, batch);
      setSavedAt(new Date());
      setError(null);
    } catch (err) {
      // Kembalikan ke antrean supaya dicoba lagi pada perubahan berikutnya
      for (const u of batch)
        pending.current.set(u.detailId, { ...u, ...pending.current.get(u.detailId) });
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }, [runId]);

  const queue = useCallback(
    (update: RunItemUpdate) => {
      if (!runId) return;
      queryClient.setQueryData<OpnameRun>(opnameKeys.run(runId), (prev) =>
        prev ? applyUpdate(prev, update) : prev,
      );
      const prevUpdate = pending.current.get(update.detailId);
      pending.current.set(update.detailId, { ...prevUpdate, ...update });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), delay);
    },
    [runId, queryClient, flush, delay],
  );

  // Kirim sisa perubahan saat keluar dari layar kerja
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      void flush();
    },
    [flush],
  );

  return { queue, flush, saving, savedAt, error, hasPending: () => pending.current.size > 0 };
}

/** id produk → nama opname yang sedang menghitungnya (dikunci dari transaksi) */
export function useOpnameLockedProducts(): ReadonlyMap<string, string> {
  const { data } = useActiveOpnames();
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const run of data ?? []) for (const i of run.items) map.set(i.product.id, run.name);
    return map;
  }, [data]);
}
