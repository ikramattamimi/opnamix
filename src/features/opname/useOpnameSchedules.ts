import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { opnameApi } from './api';
import { opnameKeys } from './keys';
import { OpnameScheduleConfig } from './types';

export function useOpnameSchedules(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: opnameKeys.schedules(),
    queryFn: opnameApi.getOpnameSchedules,
    enabled: options?.enabled,
  });
}

// Jadwal aktif beserta tanggal opname berikutnya
export function useActiveOpnameSchedules() {
  return useQuery({
    queryKey: opnameKeys.activeSchedules(),
    queryFn: opnameApi.getActiveSchedules,
  });
}

// Jadwal tidak mengubah status opname maupun stok, jadi cukup refresh jadwal
const useInvalidateSchedules = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: opnameKeys.schedules() });
};

export function useCreateOpnameSchedule() {
  const invalidateSchedules = useInvalidateSchedules();
  return useMutation({
    mutationFn: (config: OpnameScheduleConfig) => opnameApi.createOpnameSchedule(config),
    onSuccess: invalidateSchedules,
  });
}

export function useUpdateOpnameSchedule() {
  const invalidateSchedules = useInvalidateSchedules();
  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: OpnameScheduleConfig }) =>
      opnameApi.updateOpnameSchedule(id, config),
    onSuccess: invalidateSchedules,
  });
}

export function useDeleteOpnameSchedule() {
  const invalidateSchedules = useInvalidateSchedules();
  return useMutation({
    mutationFn: (id: string) => opnameApi.deleteOpnameSchedule(id),
    onSuccess: invalidateSchedules,
  });
}

export function useToggleOpnameSchedule() {
  const invalidateSchedules = useInvalidateSchedules();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      opnameApi.toggleOpnameScheduleStatus(id, isActive),
    onSuccess: invalidateSchedules,
  });
}
