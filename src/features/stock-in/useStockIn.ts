import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateTransactionPayload } from '@/lib/api';
import { QUERY_KEYS } from '@/hooks/useSupabaseQuery';

import { keepPreviousData } from '@tanstack/react-query';
import { PaginationParams } from '@/types';

export function useStockInReceipts(params?: PaginationParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.stockIn, params],
    queryFn: () => api.getStockInReceipts(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Payload matches api.createTransaction input roughly
// We might need to refine this based on what StockInForm submits
export function useCreateStockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => api.createTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockIn });
      // Also invalidate products because stock increases
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    },
  });
}
