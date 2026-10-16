import { PaginationParams } from '@/types/pagination';

export const stockInKeys = {
  all: ['stockIn'] as const,
  list: (params?: PaginationParams) => [...stockInKeys.all, 'list', params] as const,
};
