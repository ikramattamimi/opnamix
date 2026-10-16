import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { opnameApi } from './api';
import { opnameKeys } from './keys';
import { invalidateOpnameChange } from '@/lib/invalidate';

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
    mutationFn: ({ opnameId, scheduleObatIds }: { opnameId: string; scheduleObatIds: string[] }) =>
      opnameApi.backwardToStepOne(opnameId, scheduleObatIds),
    onSuccess: () => invalidateOpnameChange(queryClient),
  });
}

// Simpan detail sekaligus pindah ke langkah `step`
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
    }) => opnameApi.saveDraft(opnameId, step, updates),
    onSuccess: () => invalidateOpnameChange(queryClient),
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

// Langkah 3 selesai: stok master_obat diperbarui dan kunci dilepas
export function useFinishOpname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (opnameId: string) => opnameApi.finishOpname(opnameId),
    onSuccess: () => invalidateOpnameChange(queryClient),
  });
}

export function useDeleteOpname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (opnameId: string) => opnameApi.deleteOpname(opnameId),
    onSuccess: () => invalidateOpnameChange(queryClient),
  });
}
