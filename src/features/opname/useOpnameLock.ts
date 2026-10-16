import { useState, useEffect } from 'react';
import { opnameApi } from './api';

export interface OpnameLockInfo {
  id: string;
  opnameNumber: string;
  currentStep: number;
  startedAt: string | null;
}

export interface OpnameLockState {
  isLocked: boolean;
  opname: OpnameLockInfo | null;
  isLoading: boolean;
}

// Status kunci opname untuk UI. Kunci aktif selama ada opname
// 'sedang_dilaksanakan' di langkah mana pun. Polling ini hanya untuk
// menampilkan OpnameLockPage; penolakan transaksi stok yang sebenarnya
// dilakukan di database, jadi tab yang belum ter-refresh tetap aman.
export function useOpnameLock() {
  const [lockState, setLockState] = useState<OpnameLockState>({
    isLocked: false,
    opname: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkLock = async () => {
      try {
        const result = await opnameApi.getActiveOpnameLock();
        setLockState({ ...result, isLoading: false });
      } catch (error) {
        console.error('Failed to check opname lock:', error);
        setLockState({ isLocked: false, opname: null, isLoading: false });
      }
    };

    // Initial check
    checkLock();

    // Poll every 30 seconds
    const interval = setInterval(checkLock, 30000);

    return () => clearInterval(interval);
  }, []);

  const refetch = async () => {
    try {
      const result = await opnameApi.getActiveOpnameLock();
      setLockState({ ...result, isLoading: false });
    } catch (error) {
      console.error('Failed to check opname lock:', error);
    }
  };

  return { ...lockState, refetch };
}
