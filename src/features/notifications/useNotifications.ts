import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { notificationsApi, NotificationList } from './api';
import { notificationKeys } from './keys';

/**
 * Role user yang dipakai untuk menyaring notifikasi. Array-nya stabil selama
 * isi role tidak berubah, jadi aman dipakai sebagai dependency.
 */
export function useNotificationRoles(): string[] {
  const { userProfile } = useAuth();
  const roles = userProfile?.roles ?? (userProfile?.role ? [userProfile.role] : []);
  const rolesKey = roles.filter(Boolean).join(',');
  return useMemo(() => (rolesKey ? rolesKey.split(',') : []), [rolesKey]);
}

/** Daftar notifikasi terbaru dan jumlah yang belum dibaca. */
export function useNotifications(userId: string) {
  const roles = useNotificationRoles();
  return useQuery({
    queryKey: notificationKeys.list(userId),
    queryFn: () => notificationsApi.getList(userId, roles),
    enabled: !!userId,
  });
}

function useOptimisticListUpdate(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = notificationKeys.list(userId);

  return {
    apply: async (update: (prev: NotificationList) => NotificationList) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NotificationList>(queryKey);
      if (previous) queryClient.setQueryData<NotificationList>(queryKey, update(previous));
      return { previous };
    },
    rollback: (context?: { previous?: NotificationList }) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  };
}

export function useMarkNotificationRead(userId: string) {
  const { apply, rollback } = useOptimisticListUpdate(userId);
  return useMutation({
    mutationFn: (notificationId: number) => notificationsApi.markAsRead(notificationId),
    onMutate: (notificationId) =>
      apply((prev) => ({
        notifications: prev.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      })),
    onError: (err, _id, context) => {
      console.error('Error marking notification as read:', err);
      rollback(context);
    },
  });
}

export function useMarkAllNotificationsRead(userId: string) {
  const roles = useNotificationRoles();
  const { apply, rollback } = useOptimisticListUpdate(userId);
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(userId, roles),
    onMutate: () =>
      apply((prev) => ({
        notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      })),
    onError: (err, _vars, context) => {
      console.error('Error marking all as read:', err);
      rollback(context);
    },
  });
}
