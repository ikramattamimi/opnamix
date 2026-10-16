import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from './api';
import { Service } from './types';
import { serviceKeys } from './keys';

import { keepPreviousData } from '@tanstack/react-query';
import { PaginationParams } from '@/types/pagination';

export function useServices(params?: PaginationParams) {
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => servicesApi.getServices(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60, // 1 hour (rarely changes)
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newService: Partial<Service>) => servicesApi.createService(newService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Service> }) =>
      servicesApi.updateService(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}
