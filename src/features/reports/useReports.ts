import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { reportsApi } from './api';
import { reportKeys } from './keys';

interface ReportQueryOptions {
  enabled?: boolean;
}

export function useStockMutations(from: Date, to: Date, options?: ReportQueryOptions) {
  return useQuery({
    queryKey: reportKeys.mutations(from.toISOString(), to.toISOString()),
    queryFn: () => reportsApi.getStockMutations(from, to),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

export function useTransactionReport(from: Date, to: Date, options?: ReportQueryOptions) {
  return useQuery({
    queryKey: reportKeys.transactions(from.toISOString(), to.toISOString()),
    queryFn: () => reportsApi.getTransactions(from, to),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

export function useExpiringBatches(months = 6) {
  return useQuery({
    queryKey: reportKeys.expiring(months),
    queryFn: () => reportsApi.getExpiringBatches(months),
  });
}
