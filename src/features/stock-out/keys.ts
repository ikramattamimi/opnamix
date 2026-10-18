import { PaginationParams } from '@/types/pagination';

export const stockOutKeys = {
  all: ['stockOut'] as const,
  list: (params?: PaginationParams) => [...stockOutKeys.all, 'list', params] as const,
  nakesProfiles: () => [...stockOutKeys.all, 'nakesProfiles'] as const,
};
