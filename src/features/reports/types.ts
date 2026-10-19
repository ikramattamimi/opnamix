import type { Product } from '@/features/products/types';

export type MutationType = 'Masuk' | 'Keluar' | 'Penyesuaian';

/** Satu baris mutasi stok: item stok masuk, item stok keluar, atau selisih opname */
export interface MutationRow {
  key: string;
  date: string;
  code: string;
  type: MutationType;
  product: Product;
  /** Bertanda: masuk +, keluar −, penyesuaian = selisih */
  qty: number;
  /** |qty| × harga beli */
  value: number;
  by: string;
  note: string;
  link: { kind: 'stock-in' } | { kind: 'stock-out'; id: string } | { kind: 'opname'; id: string };
}

export interface TransactionLine {
  id: string;
  productId?: string;
  name: string;
  brand?: string;
  unit?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

/** Transaksi stok keluar (permintaan atau manual) */
export interface TransactionRow {
  id: string;
  code: string;
  date: string;
  processedAt: string | null;
  kind: 'Permintaan' | 'Manual';
  status: 'Menunggu' | 'Selesai';
  patient: string;
  requestedBy: string;
  processedBy: string | null;
  note: string;
  drugs: TransactionLine[];
  services: TransactionLine[];
  drugTotal: number;
  serviceTotal: number;
  serviceFee: number;
  discount: number;
  total: number;
}

export interface ExpiringBatch {
  key: string;
  product: Product;
  batch: string | null;
  expireDate: string;
  quantity: number;
  supplier: string | null;
}
