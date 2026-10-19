// Helper tampilan notifikasi (ikon, warna, waktu relatif). Tanpa akses data.
import {
  Archive,
  ArrowLeftRight,
  Bell,
  BriefcaseMedical,
  CircleAlert,
  CircleCheck,
  CircleCheckBig,
  CirclePlus,
  ClipboardList,
  Diff,
  ListChecks,
  Search,
  Store,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/types/routes';

const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  STOCK_OUT_REQUEST: ClipboardList,
  STOCK_OUT_PROCESSED: CircleCheck,
  STOCK_LOW: TriangleAlert,
  STOCK_EMPTY: CircleAlert,
  OPNAME_STARTED: Search,
  OPNAME_COMPLETED: CircleCheckBig,
  OPNAME_CREATED: ListChecks,
  OPNAME_STEP_CHANGED: ArrowLeftRight,
  STOCK_IN: Archive,
  STOCK_OUT_DIRECT: Store,
  OPNAME_DISCREPANCY: Diff,
  PRODUCT_ADDED: CirclePlus,
  PRODUCT_DELETED: Trash2,
  SERVICE_ADDED: BriefcaseMedical,
};

/**
 * Ikon lucide untuk tipe notifikasi.
 */
export function getNotificationLucideIcon(type: string): LucideIcon {
  return NOTIFICATION_ICONS[type] ?? Bell;
}

export type NotificationTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

const NOTIFICATION_TONES: Record<string, NotificationTone> = {
  STOCK_OUT_REQUEST: 'info',
  STOCK_OUT_PROCESSED: 'ok',
  STOCK_LOW: 'warn',
  STOCK_EMPTY: 'bad',
  OPNAME_STARTED: 'info',
  OPNAME_COMPLETED: 'ok',
  OPNAME_CREATED: 'info',
  OPNAME_STEP_CHANGED: 'info',
  STOCK_IN: 'ok',
  STOCK_OUT_DIRECT: 'info',
  OPNAME_DISCREPANCY: 'warn',
  PRODUCT_ADDED: 'ok',
  PRODUCT_DELETED: 'bad',
  SERVICE_ADDED: 'ok',
};

/**
 * Nada warna (token status) untuk tipe notifikasi.
 */
export function getNotificationTone(type: string): NotificationTone {
  return NOTIFICATION_TONES[type] ?? 'neutral';
}

const TONE_TEXT: Record<NotificationTone, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  bad: 'text-bad',
  info: 'text-info',
  neutral: 'text-muted-foreground',
};

/**
 * Kelas warna teks ikon notifikasi.
 */
export function getNotificationColor(type: string): string {
  return TONE_TEXT[getNotificationTone(type)];
}

/**
 * Format the relative time for a notification (e.g. "2 menit lalu").
 */
export function formatNotificationTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

const NOTIFICATION_TARGETS: Partial<Record<string, string>> = {
  STOCK_OUT_REQUEST: ROUTES.STOK_KELUAR,
  STOCK_OUT_PROCESSED: ROUTES.STOK_KELUAR,
  STOCK_OUT_DIRECT: ROUTES.STOK_KELUAR,
  STOCK_LOW: ROUTES.MASTER_DATA_PRODUK,
  STOCK_EMPTY: ROUTES.MASTER_DATA_PRODUK,
  PRODUCT_ADDED: ROUTES.MASTER_DATA_PRODUK,
  PRODUCT_DELETED: ROUTES.MASTER_DATA_PRODUK,
  STOCK_IN: ROUTES.STOK_MASUK,
  SERVICE_ADDED: ROUTES.MASTER_DATA_JASA,
  OPNAME_STARTED: ROUTES.STOK_OPNAME,
  OPNAME_COMPLETED: ROUTES.STOK_OPNAME,
  OPNAME_CREATED: ROUTES.STOK_OPNAME,
  OPNAME_STEP_CHANGED: ROUTES.STOK_OPNAME,
  OPNAME_DISCREPANCY: ROUTES.STOK_OPNAME,
};

/**
 * Halaman yang dibuka saat notifikasi diklik. Tipe tak dikenal ke halaman Notifikasi.
 */
export function getNotificationTarget(type: string): string {
  return NOTIFICATION_TARGETS[type] ?? ROUTES.NOTIFICATIONS;
}

const TARGET_LABELS: Record<string, string> = {
  [ROUTES.STOK_KELUAR]: 'Buka Stok Keluar',
  [ROUTES.STOK_MASUK]: 'Buka Stok Masuk',
  [ROUTES.MASTER_DATA_PRODUK]: 'Buka Data Produk',
  [ROUTES.MASTER_DATA_JASA]: 'Buka Data Jasa',
  [ROUTES.STOK_OPNAME]: 'Buka Stok Opname',
};

/** Teks tombol menuju halaman tujuan notifikasi, atau null kalau tidak ada tujuan. */
export function getNotificationTargetLabel(type: string): string | null {
  return TARGET_LABELS[getNotificationTarget(type)] ?? null;
}

const TYPE_LABELS: Record<string, string> = {
  STOCK_OUT_REQUEST: 'Permintaan stok keluar',
  STOCK_OUT_PROCESSED: 'Permintaan diproses',
  STOCK_OUT_DIRECT: 'Stok keluar manual',
  STOCK_IN: 'Stok masuk',
  STOCK_LOW: 'Stok menipis',
  STOCK_EMPTY: 'Stok habis',
  OPNAME_CREATED: 'Jadwal opname',
  OPNAME_STARTED: 'Opname dimulai',
  OPNAME_STEP_CHANGED: 'Tahap opname berubah',
  OPNAME_DISCREPANCY: 'Selisih opname',
  OPNAME_COMPLETED: 'Opname selesai',
  PRODUCT_ADDED: 'Produk baru',
  PRODUCT_DELETED: 'Produk dihapus',
  SERVICE_ADDED: 'Jasa baru',
};

/** Nama jenis notifikasi; tipe tak dikenal ditampilkan apa adanya. */
export function getNotificationTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export const NOTIFICATION_GROUPS = ['Transaksi', 'Stok', 'Opname', 'Master data'] as const;
export type NotificationGroup = (typeof NOTIFICATION_GROUPS)[number];

/** Kelompok jenis notifikasi untuk filter. Tipe tak dikenal masuk null. */
export function getNotificationGroup(type: string): NotificationGroup | null {
  if (type.startsWith('STOCK_OUT') || type === 'STOCK_IN') return 'Transaksi';
  if (type === 'STOCK_LOW' || type === 'STOCK_EMPTY') return 'Stok';
  if (type.startsWith('OPNAME_')) return 'Opname';
  if (type.startsWith('PRODUCT_') || type.startsWith('SERVICE_')) return 'Master data';
  return null;
}

/** Jam saja, contoh "14.30". */
export function formatNotificationClock(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
