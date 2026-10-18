import { ROUTES } from '@/types/routes';
import type { StockOutRequest } from './types';

// Membuka POS Stok Keluar dari daftar: mode baru, edit permintaan yang menunggu,
// atau salin isi transaksi lama ke permintaan baru (lewat state router).

export type PosOutMode = 'permintaan' | 'manual';

export interface PosOutState {
  request: StockOutRequest;
  intent: 'edit' | 'copy';
}

export const posOutPath = (mode: PosOutMode = 'permintaan') =>
  mode === 'manual' ? `${ROUTES.STOK_KELUAR_BARU}?mode=manual` : ROUTES.STOK_KELUAR_BARU;
