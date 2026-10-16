/**
 * Notification API functions
 * Handles fetching, reading, and managing notifications from Supabase
 */

import { supabase } from '@/lib/supabaseClient';
import { AppNotification } from './types';
import type { Json } from '@/lib/database.types';

const MAX_NOTIFICATIONS = 50;

export interface NotificationList {
  notifications: AppNotification[];
  unreadCount: number;
}

/**
 * Filter `or` untuk notifikasi yang ditujukan ke user (user_id), salah satu
 * role-nya (target_role), atau broadcast (keduanya null).
 */
function visibleFilter(userId: string, roles: string[]): string {
  const roleParts = roles.filter(Boolean).map((r) => `and(user_id.is.null,target_role.eq.${r})`);
  return [`user_id.eq.${userId}`, ...roleParts, `and(user_id.is.null,target_role.is.null)`].join(
    ',',
  );
}

export const notificationsApi = {
  /** 50 notifikasi terbaru dan jumlah semua yang belum dibaca. */
  getList: async (userId: string, roles: string[]): Promise<NotificationList> => {
    if (!userId) return { notifications: [], unreadCount: 0 };
    const filter = visibleFilter(userId, roles);

    const [listRes, countRes] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .or(filter)
        .order('created_at', { ascending: false })
        .limit(MAX_NOTIFICATIONS),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .or(filter),
    ]);

    if (listRes.error) throw listRes.error;
    if (countRes.error) throw countRes.error;

    return {
      notifications: (listRes.data as AppNotification[]) || [],
      unreadCount: countRes.count || 0,
    };
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  /** Tandai semua notifikasi yang terlihat oleh user sebagai dibaca. */
  markAllAsRead: async (userId: string, roles: string[]): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
      .or(visibleFilter(userId, roles));
    if (error) throw error;
  },
};

/** Batas jumlah notifikasi yang disimpan di cache daftar. */
export const NOTIFICATION_LIST_LIMIT = MAX_NOTIFICATIONS;

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
