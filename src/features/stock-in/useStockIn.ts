import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, CreateTransactionPayload } from '@/features/transactions/api';
import { stockInApi } from './api';
import { stockInKeys } from './keys';
import { invalidateStockChange } from '@/lib/invalidate';

import { keepPreviousData } from '@tanstack/react-query';
import { PaginationParams } from '@/types/pagination';

export function useStockInReceipts(params?: PaginationParams) {
  return useQuery({
    queryKey: stockInKeys.list(params),
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
    // Stok masuk langsung berstatus selesai, jadi stok obat ikut berubah
    onSuccess: () => invalidateStockChange(queryClient),
  });
}
