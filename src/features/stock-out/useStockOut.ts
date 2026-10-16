import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect } from 'react';
import { transactionsApi, CreateTransactionPayload } from '@/features/transactions/api';
import { stockOutApi } from './api';
import { stockOutKeys } from './keys';
import { dashboardKeys } from '@/features/dashboard/keys';
import { invalidateStockChange } from '@/lib/invalidate';
import { supabase } from '@/lib/supabaseClient';
import { PaginationParams } from '@/types/pagination';

export function useStockOutRequests(params?: PaginationParams) {
  return useQuery({
    queryKey: stockOutKeys.list(params),
    queryFn: () => stockOutApi.getStockOutRequests(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Subscribe ke Supabase Realtime pada tabel `transaksi`.
 * Ketika ada INSERT atau UPDATE, invalidate query stockOut
 * sehingga data langsung ter-refresh tanpa polling.
 */
export function useStockOutRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('transaksi-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transaksi' }, () => {
        queryClient.invalidateQueries({ queryKey: stockOutKeys.all });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transaksi' }, () => {
        queryClient.invalidateQueries({ queryKey: stockOutKeys.all });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useCreateStockOutRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => transactionsApi.createTransaction(payload),
    onSuccess: (_data, payload) => {
      // Stok keluar manual langsung selesai (stok berubah); permintaan nakes
      // masih diajukan (hanya daftar dan hitungan tertunda di dashboard).
      if (payload.status === 'selesai') return invalidateStockChange(queryClient);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: stockOutKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ]);
    },
  });
}

export function useProcessStockOutRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      number,
      status,
      diskon,
      total,
      serviceFee,
    }: {
      number: string;
      status: 'selesai';
      diskon?: number;
      total?: number;
      serviceFee?: number;
    }) => stockOutApi.updateTransactionStatus(number, status, diskon, total, serviceFee),
    onSuccess: () => invalidateStockChange(queryClient),
  });
}

export function useUpdateStockOutRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      number,
      payload,
    }: {
      number: string;
      payload: {
        tanggal?: string;
        nama_pasien: string;
        tanggal_lahir_pasien?: string;
        nama_nakes?: string;
        total: number;
        diskon?: number;
        serviceFee?: number;
        items: {
          productId: string;
          quantity: number;
          price: number;
        }[];
        services: {
          serviceId: string;
          price: number;
        }[];
      };
    }) => stockOutApi.updatePendingStockOutRequest(number, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stockOutKeys.all }),
  });
}
