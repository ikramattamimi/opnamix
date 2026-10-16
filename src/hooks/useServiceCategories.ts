import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ServiceCategoryType } from '../types';
import { QUERY_KEYS } from './useSupabaseQuery';

export function useServiceCategories() {
  return useQuery<ServiceCategoryType[]>({
    queryKey: QUERY_KEYS.serviceCategories,
    queryFn: () => api.getServiceCategories(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: { name: string; description?: string }) =>
      api.createServiceCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.serviceCategories });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
    },
  });
}
