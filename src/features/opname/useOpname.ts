import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { opnameApi } from './api';
import { opnameKeys } from './keys';
import { invalidateOpnameChange } from '@/lib/invalidate';
import { createNotification } from '@/features/notifications/api';

type OpnameDetailUpdates = NonNullable<Parameters<typeof opnameApi.saveDraft>[2]>;

const opnameDetailQuery = (id: string) =>
  queryOptions({
    queryKey: opnameKeys.detail(id),
    queryFn: () => opnameApi.getOpnameById(id),
  });

export function useOpname(id: string | undefined) {
  return useQuery({ ...opnameDetailQuery(id ?? ''), enabled: !!id });
}

// Untuk handler yang butuh data opname terbaru setelah mutasi. Mutasi di
// bawah menunggu invalidasi selesai, jadi biasanya ini langsung dari cache.
export function useFetchOpname() {
  const queryClient = useQueryClient();
  return useCallback((id: string) => queryClient.fetchQuery(opnameDetailQuery(id)), [queryClient]);
}

// Baris jurnal penyesuaian untuk halaman detail opname yang sudah selesai
export function useOpnameDetailView(id: string | undefined) {
  return useQuery({
    queryKey: opnameKeys.detailView(id ?? ''),
    queryFn: () => opnameApi.getOpnameDetailView(id!),
    enabled: !!id,
  });
}

const OPNAME_NOTIFICATION_ROLES = ['admin', 'apoteker', 'farmasi'];

// Notifikasi perubahan langkah opname untuk role yang mengelola opname.
// Gagal mengirim notifikasi tidak menggagalkan mutasi yang sudah berhasil.
const notifyOpname = async (
  notification: Omit<Parameters<typeof createNotification>[0], 'target_roles'>,
) => {
  try {
    await createNotification({ ...notification, target_roles: OPNAME_NOTIFICATION_ROLES });
  } catch (error) {
    console.error('Failed to create opname notification:', error);
  }
};

// Semua mutasi yang mengubah status/langkah opname atau stok memakai
// invalidateOpnameChange. onSuccess mengembalikan promise, jadi mutateAsync
// baru selesai setelah query aktif ter-refresh.

export function useStartOpname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, date }: { scheduleId: string | null; date: string }) =>
      opnameApi.startOpname(scheduleId, date),
    onSuccess: () => invalidateOpnameChange(queryClient),
  });
}

// Langkah 1 → 2: detail dibuat dan opname menjadi sedang_dilaksanakan (stok terkunci)
export function useCompleteOpnameStepOne() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ opnameId, productIds }: { opnameId: string; productIds: string[] }) =>
      opnameApi.completeStepOne(opnameId, productIds),
    onSuccess: () => invalidateOpnameChange(queryClient),
  });
}

// Langkah 2 → 1: detail dihapus dan kunci stok dilepas
export function useBackwardOpnameToStepOne() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      opnameId,
      scheduleObatIds,
    }: {
      opnameId: string;
      scheduleObatIds: string[];
      opnameNumber?: string;
    }) => opnameApi.backwardToStepOne(opnameId, scheduleObatIds),
    onSuccess: async (_data, { opnameId, opnameNumber }) => {
      await invalidateOpnameChange(queryClient);
      await notifyOpname({
        type: 'OPNAME_STEP_CHANGED',
        title: 'Opname Kembali ke Tahap 1',
        message: `Opname ${opnameNumber} kembali ke tahap 1: Pemilihan Obat. Progress tahap 2 telah dihapus.`,
        data: {
          opname_id: parseInt(opnameId),
          opname_number: opnameNumber,
          step: 1,
          action: 'backward',
        },
      });
    },
  });
}

// Simpan detail sekaligus pindah ke langkah `step`. Masuk langkah 3 dikabarkan
// lewat notifikasi.
export function useMoveOpnameStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      opnameId,
      step,
      updates,
    }: {
      opnameId: string;
      step: number;
      updates: OpnameDetailUpdates;
      opnameNumber?: string;
    }) => opnameApi.saveDraft(opnameId, step, updates),
    onSuccess: async (_data, { opnameId, step, opnameNumber }) => {
      await invalidateOpnameChange(queryClient);
      if (step !== 3) return;
      await notifyOpname({
        type: 'OPNAME_STEP_CHANGED',
        title: 'Opname Memasuki Tahap 3',
        message: `Opname ${opnameNumber} telah memasuki tahap 3: Penyesuaian Stok.`,
        data: { opname_id: parseInt(opnameId), opname_number: opnameNumber, step: 3 },
      });
    },
  });
}

// Simpan draft: detail saja, current_step tidak berubah
export function useSaveOpnameDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ opnameId, updates }: { opnameId: string; updates: OpnameDetailUpdates }) =>
      opnameApi.saveDetailOnly(opnameId, updates),
    onSuccess: (_data, { opnameId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: opnameKeys.detail(opnameId) }),
        queryClient.invalidateQueries({ queryKey: opnameKeys.detailView(opnameId) }),
      ]),
  });
}

// Hanya mengisi alasan di detail; status opname dan stok tidak berubah
export function useResolveOpnameDifference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ detailId, reason }: { detailId: string; reason: string }) =>
      opnameApi.resolveOpnameDifference(detailId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: opnameKeys.all }),
  });
}

// Langkah 3 selesai: detail final disimpan, lalu stok master_obat diperbarui
// dan kunci dilepas. Invalidasi sekali setelah keduanya.
export function useFinishOpname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      opnameId,
      updates,
    }: {
      opnameId: string;
      updates: OpnameDetailUpdates;
      opnameNumber?: string;
    }) => {
      await opnameApi.saveDraft(opnameId, 3, updates);
      await opnameApi.finishOpname(opnameId);
    },
    onSuccess: async (_data, { opnameId, opnameNumber }) => {
      await invalidateOpnameChange(queryClient);
      await notifyOpname({
        type: 'OPNAME_COMPLETED',
        title: 'Opname Selesai',
        message: `Opname ${opnameNumber} telah selesai. Stok telah diperbarui sesuai hasil opname.`,
        data: { opname_id: parseInt(opnameId), opname_number: opnameNumber },
      });
    },
  });
}

export function useDeleteOpname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (opnameId: string) => opnameApi.deleteOpname(opnameId),
    onSuccess: () => invalidateOpnameChange(queryClient),
  });
}
