import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Product } from '../types';
import { QUERY_KEYS } from './useSupabaseQuery';

import { keepPreviousData } from '@tanstack/react-query';
import { PaginationParams } from '../types';

export function useProducts(params?: PaginationParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, params],
    queryFn: () => api.getProducts(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60, // 1 hour (Master Data rarely changes)
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProduct: Partial<Product>) => api.createProduct(newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      api.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    },
  });
}
