import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from './api';
import { ServiceCategoryType } from './types';
import { serviceCategoryKeys, serviceKeys } from './keys';

export function useServiceCategories() {
  return useQuery<ServiceCategoryType[]>({
    queryKey: serviceCategoryKeys.all,
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
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}
