import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, CreateTransactionPayload } from '@/features/transactions/api';
import { stockInApi } from './api';
import { QUERY_KEYS } from '@/hooks/useSupabaseQuery';

import { keepPreviousData } from '@tanstack/react-query';
import { PaginationParams } from '@/types/pagination';

export function useStockInReceipts(params?: PaginationParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.stockIn, params],
    queryFn: () => stockInApi.getStockInReceipts(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Payload matches transactionsApi.createTransaction input roughly
// We might need to refine this based on what StockInForm submits
export function useCreateStockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => transactionsApi.createTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockIn });
      // Also invalidate products because stock increases
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    },
  });
}
