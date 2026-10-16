import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Service } from '../types';
import { QUERY_KEYS } from './useSupabaseQuery';

import { keepPreviousData } from '@tanstack/react-query';
import { PaginationParams } from '../types';

export function useServices(params?: PaginationParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.services, params],
    queryFn: () => api.getServices(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60, // 1 hour (rarely changes)
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newService: Partial<Service>) => api.createService(newService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Service> }) =>
      api.updateService(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
    },
  });
}
