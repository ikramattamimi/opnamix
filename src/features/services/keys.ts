import { PaginationParams } from '@/types/pagination';

export const serviceKeys = {
  all: ['services'] as const,
  list: (params?: PaginationParams) => [...serviceKeys.all, 'list', params] as const,
};

export const serviceCategoryKeys = {
  all: ['serviceCategories'] as const,
};
