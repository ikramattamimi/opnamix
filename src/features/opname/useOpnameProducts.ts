import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { productsApi } from '@/features/products/api';
import { productKeys } from '@/features/products/keys';

// Semua obat untuk dipilih di opname. Key sama dengan useProducts(params),
// jadi cache-nya dibagi dengan halaman lain yang memakai parameter ini.
const ALL_PRODUCTS = { page: 1, perPage: 1000 };

const allProductsQuery = queryOptions({
  queryKey: productKeys.list(ALL_PRODUCTS),
  queryFn: () => productsApi.getProducts(ALL_PRODUCTS),
  staleTime: 1000 * 60 * 60, // sama dengan useProducts
});

export function useOpnameProducts(options?: { enabled?: boolean }) {
  return useQuery({ ...allProductsQuery, enabled: options?.enabled });
}

// Untuk handler yang butuh daftar obat terbaru setelah mutasi
export function useFetchOpnameProducts() {
  const queryClient = useQueryClient();
  return useCallback(() => queryClient.fetchQuery(allProductsQuery), [queryClient]);
}
