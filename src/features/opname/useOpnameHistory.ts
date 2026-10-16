import { useQuery } from '@tanstack/react-query';
import { opnameApi } from './api';
import { opnameKeys } from './keys';

// Opname selesai
export function useOpnameHistory() {
  return useQuery({
    queryKey: opnameKeys.history(),
    queryFn: opnameApi.getOpnameHistory,
  });
}

// Opname belum_dilaksanakan
export function useUpcomingOpnames() {
  return useQuery({
    queryKey: opnameKeys.upcoming(),
    queryFn: opnameApi.getUpcomingOpnames,
  });
}

// Opname sedang_dilaksanakan
export function useDraftOpnames() {
  return useQuery({
    queryKey: opnameKeys.drafts(),
    queryFn: opnameApi.getDraftOpnames,
  });
}
