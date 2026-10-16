import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';
import { dashboardKeys } from './keys';

// Dipakai Dashboard dan ProductManagement, jadi cache-nya dibagi.
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardApi.getDashboardStats(),
  });
}

export function useRecentTransactions(page: number, perPage: number) {
  return useQuery({
    queryKey: dashboardKeys.recentTransactions(page, perPage),
    queryFn: () => dashboardApi.getRecentTransactions(page, perPage),
    placeholderData: keepPreviousData,
  });
}
