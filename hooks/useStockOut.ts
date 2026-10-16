import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { QUERY_KEYS } from './useSupabaseQuery';
import { supabase } from '../lib/supabaseClient';
import { PaginationParams } from '../types';

export function useStockOutRequests(params?: PaginationParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.stockOut, params],
    queryFn: () => api.getStockOutRequests(params),
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
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockOut });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transaksi' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockOut });
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
    mutationFn: (payload: any) => api.createTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockOut });
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
    }) => api.updateTransactionStatus(number, status, diskon, total, serviceFee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockOut });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products }); // Stock updated
    },
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
    }) => api.updatePendingStockOutRequest(number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockOut });
    },
  });
}
