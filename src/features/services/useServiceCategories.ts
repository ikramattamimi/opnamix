import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from './api';
import { ServiceCategoryType } from '@/types';
import { QUERY_KEYS } from '@/hooks/useSupabaseQuery';

export function useServiceCategories() {
  return useQuery<ServiceCategoryType[]>({
    queryKey: QUERY_KEYS.serviceCategories,
    queryFn: () => servicesApi.getServiceCategories(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: { name: string; description?: string }) =>
      servicesApi.createServiceCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.serviceCategories });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
    },
  });
}
