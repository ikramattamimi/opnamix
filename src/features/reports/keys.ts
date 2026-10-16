import { PaginationParams } from '@/types/pagination';

export const reportKeys = {
  all: ['reports'] as const,
  transactions: (startDate: string, endDate: string, params?: PaginationParams) =>
    [...reportKeys.all, 'transactions', startDate, endDate, params] as const,
  stockMutations: (startDate: string, endDate: string, params?: PaginationParams) =>
    [...reportKeys.all, 'stockMutations', startDate, endDate, params] as const,
};
