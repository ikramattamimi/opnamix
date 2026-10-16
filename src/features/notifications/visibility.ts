import { AppNotification } from './types';

/**
 * Apakah notifikasi baru (mis. dari realtime) terlihat oleh user ini.
 * Aturannya sama dengan visibleFilter.
 */
export function isNotificationVisible(
  notification: Pick<AppNotification, 'user_id' | 'target_role'>,
  userId: string,
  roles: string[],
): boolean {
  if (notification.user_id !== null) return notification.user_id === userId;
  if (notification.target_role === null) return true;
  return roles.includes(notification.target_role);
}
