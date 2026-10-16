import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { opnameApi } from './api';
import { opnameKeys } from './keys';
import type { ApiResult } from '@/types/api';

export type OpnameLock = ApiResult<typeof opnameApi.getActiveOpnameLock>;
export type OpnameLockInfo = NonNullable<OpnameLock['opname']>;

// Status kunci opname untuk UI. Kunci aktif selama ada opname
// 'sedang_dilaksanakan' di langkah mana pun. Tidak ada polling: perubahan
// datang lewat useOpnameLockRealtime, ditambah cek ulang saat tab kembali
// aktif. Penolakan transaksi stok yang sebenarnya dilakukan di database,
// jadi tab yang belum ter-refresh tetap aman.
export function useActiveOpnameLock() {
  return useQuery({
    queryKey: opnameKeys.lock(),
    queryFn: opnameApi.getActiveOpnameLock,
    // Event realtime yang terjadi saat tab tidur/koneksi putus bisa hilang
    refetchOnWindowFocus: 'always',
  });
}

// Pasang sekali untuk sesi yang login (AuthenticatedApp). Channel ditutup
// saat unmount, termasuk saat logout.
export function useOpnameLockRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidateLock = () => queryClient.invalidateQueries({ queryKey: opnameKeys.lock() });
    let hasSubscribed = false;

    return opnameApi.subscribeToOpnameChanges({
      onChange: invalidateLock,
      onSubscribed: () => {
        // SUBSCRIBED pertama: lock baru saja diambil oleh useActiveOpnameLock.
        // SUBSCRIBED berikutnya berarti reconnect, dan event selama koneksi
        // putus hilang, jadi cek ulang.
        if (hasSubscribed) invalidateLock();
        hasSubscribed = true;
      },
    });
  }, [queryClient]);
}
