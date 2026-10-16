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

/**
 * Get the notification color based on type (for icon/badge).
 */
export function getNotificationColor(type: string): string {
  switch (type) {
    case 'STOCK_OUT_REQUEST':
      return 'text-blue-500';
    case 'STOCK_OUT_PROCESSED':
      return 'text-emerald-500';
    case 'STOCK_LOW':
      return 'text-amber-500';
    case 'STOCK_EMPTY':
      return 'text-red-500';
    case 'OPNAME_STARTED':
      return 'text-purple-500';
    case 'OPNAME_COMPLETED':
      return 'text-emerald-500';
    case 'OPNAME_CREATED':
      return 'text-indigo-500';
    case 'OPNAME_STEP_CHANGED':
      return 'text-blue-500';
    case 'STOCK_IN':
      return 'text-teal-500';
    case 'STOCK_OUT_DIRECT':
      return 'text-orange-500';
    case 'OPNAME_DISCREPANCY':
      return 'text-red-400';
    case 'PRODUCT_ADDED':
      return 'text-green-500';
    case 'PRODUCT_DELETED':
      return 'text-red-400';
    case 'SERVICE_ADDED':
      return 'text-cyan-500';
    default:
      return 'text-gray-500';
  }
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
