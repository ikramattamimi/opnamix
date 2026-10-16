import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { PaginationParams } from '@/types/pagination';
import { reportsApi } from './api';
import { reportKeys } from './keys';

interface ReportQueryOptions {
  enabled?: boolean;
}

export function useTransactionReport(
  startDate: string,
  endDate: string,
  params?: PaginationParams,
  options?: ReportQueryOptions,
) {
  return useQuery({
    queryKey: reportKeys.transactions(startDate, endDate, params),
    queryFn: () => reportsApi.getTransactionReport(startDate, endDate, params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

export function useStockMutationReport(
  startDate: string,
  endDate: string,
  params?: PaginationParams,
  options?: ReportQueryOptions,
) {
  return useQuery({
    queryKey: reportKeys.stockMutations(startDate, endDate, params),
    queryFn: () => reportsApi.getStockMutationReport(startDate, endDate, params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}
