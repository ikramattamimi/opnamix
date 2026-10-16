import { PaginationParams } from '@/types/pagination';

export const productKeys = {
  all: ['products'] as const,
  list: (params?: PaginationParams) => [...productKeys.all, 'list', params] as const,
};
