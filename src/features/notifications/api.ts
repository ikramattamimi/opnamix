/**
 * Notification API functions
 * Handles fetching, reading, and managing notifications from Supabase
 */

import { supabase } from '@/lib/supabaseClient';
import { AppNotification } from './types';
import type { Json } from '@/lib/database.types';

const MAX_NOTIFICATIONS = 50;

/**
 * Fetch notifications for the current user.
 * Returns notifications targeted to the user (by user_id), their role, or broadcast (both null).
 */
export async function getNotifications(
  userId: string,
  userRole: string | string[],
): Promise<AppNotification[]> {
  if (!userId) return [];
  const roles = (Array.isArray(userRole) ? userRole : [userRole]).filter(Boolean);
  const roleParts = roles.map((r) => `and(user_id.is.null,target_role.eq.${r})`);
  const orParts = [
    `user_id.eq.${userId}`,
    ...roleParts,
    `and(user_id.is.null,target_role.is.null)`,
  ];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .or(orParts.join(','))
    .order('created_at', { ascending: false })
    .limit(MAX_NOTIFICATIONS);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data as AppNotification[]) || [];
}

/**
 * Get count of unread notifications for the current user.
 */
export async function getUnreadCount(userId: string, userRole: string | string[]): Promise<number> {
  if (!userId) return 0;
  const roles = (Array.isArray(userRole) ? userRole : [userRole]).filter(Boolean);
  const roleParts = roles.map((r) => `and(user_id.is.null,target_role.eq.${r})`);
  const orParts = [
    `user_id.eq.${userId}`,
    ...roleParts,
    `and(user_id.is.null,target_role.is.null)`,
  ];
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
    .or(orParts.join(','));

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: number): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Mark all visible notifications as read for the current user.
 */
export async function markAllAsRead(userId: string, userRole: string | string[]): Promise<void> {
  const roles = Array.isArray(userRole) ? userRole : [userRole];
  const roleFilters = roles.map((r) => `and(user_id.is.null,target_role.eq.${r})`).join(',');
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)
    .or(`user_id.eq.${userId},${roleFilters},and(user_id.is.null,target_role.is.null)`);

  if (error) {
    console.error('Error marking all as read:', error);
  }
}

/**
 * Get the notification icon based on type.
 */
export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'STOCK_OUT_REQUEST':
      return 'assignment';
    case 'STOCK_OUT_PROCESSED':
      return 'check_circle';
    case 'STOCK_LOW':
      return 'warning';
    case 'STOCK_EMPTY':
      return 'error';
    case 'OPNAME_STARTED':
      return 'search';
    case 'OPNAME_COMPLETED':
      return 'task_alt';
    case 'OPNAME_CREATED':
      return 'playlist_add_check';
    case 'OPNAME_STEP_CHANGED':
      return 'swap_horiz';
    case 'STOCK_IN':
      return 'inventory_2';
    case 'STOCK_OUT_DIRECT':
      return 'point_of_sale';
    case 'OPNAME_DISCREPANCY':
      return 'difference';
    case 'PRODUCT_ADDED':
      return 'add_circle';
    case 'PRODUCT_DELETED':
      return 'delete';
    case 'SERVICE_ADDED':
      return 'medical_services';
    default:
      return 'notifications';
  }
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

/**
 * Buat notifikasi. Tanpa target_roles berarti broadcast (target_role null),
 * selain itu satu baris per role.
 */
export const createNotification = async (notification: {
  type: string;
  title: string;
  message: string;
  data?: Json;
  target_roles?: string[];
}) => {
  const roles = notification.target_roles || [];

  if (roles.length === 0) {
    // Broadcast notification (target_role = null)
    const { error } = await supabase.from('notifications').insert({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      target_role: null,
    });
    if (error) throw error;
  } else {
    // Insert one row per target role so each role receives the notification
    const rows = roles.map((role) => ({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      target_role: role,
    }));
    const { error } = await supabase.from('notifications').insert(rows);
    if (error) throw error;
  }

  return { success: true };
};
