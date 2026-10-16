import type { Tables } from '@/lib/database.types';

export type NotificationType =
  | 'STOCK_OUT_REQUEST'
  | 'STOCK_OUT_PROCESSED'
  | 'STOCK_LOW'
  | 'STOCK_EMPTY'
  | 'OPNAME_STARTED'
  | 'OPNAME_COMPLETED'
  | 'OPNAME_CREATED'
  | 'OPNAME_STEP_CHANGED'
  | 'STOCK_IN'
  | 'STOCK_OUT_DIRECT'
  | 'OPNAME_DISCREPANCY'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_DELETED'
  | 'SERVICE_ADDED';

// Baris tabel notifications. Kolom berikut sengaja dipersempit dari tipe
// database: type berupa NotificationType, data berupa objek, dan is_read /
// created_at dianggap tidak null.
export type AppNotification = Omit<
  Tables<'notifications'>,
  'type' | 'data' | 'is_read' | 'created_at'
> & {
  type: NotificationType;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};
