import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from './api';
import { Product } from './types';
import { productKeys } from './keys';

import { keepPreviousData } from '@tanstack/react-query';
import { PaginationParams } from '@/types/pagination';

export function useProducts(params?: PaginationParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.getProducts(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60, // 1 hour (Master Data rarely changes)
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProduct: Partial<Product>) => productsApi.createProduct(newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      productsApi.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
