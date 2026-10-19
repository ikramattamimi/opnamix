import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/toast';
import { NOTIFICATION_LIST_LIMIT, NotificationList } from './api';
import { isNotificationVisible } from './visibility';
import { notificationKeys } from './keys';
import { AppNotification } from './types';
import { useNotificationRoles } from './useNotifications';
import { playNotificationSound, showDesktopNotification } from './alerts';
import { getNotificationPreferences } from './preferences';

/**
 * Dengarkan INSERT di tabel notifications dan masukkan notifikasi yang
 * relevan ke cache useNotifications(userId). Dipasang sekali (di
 * NotificationProvider). Channel ditutup saat unmount atau userId kosong
 * (logout).
 */
export function useNotificationsRealtime(userId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const roles = useNotificationRoles();

  // Dibaca dari handler realtime supaya channel tidak dibuat ulang saat role berubah
  const rolesRef = useRef(roles);
  useEffect(() => {
    if (rolesRef.current === roles) return;
    rolesRef.current = roles;
    // Role menentukan isi daftar, jadi ambil ulang
    queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
  }, [roles, userId, queryClient]);

  useEffect(() => {
    if (!userId) return;
    const queryKey = notificationKeys.list(userId);
    let hasSubscribed = false;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as AppNotification;
          if (!isNotificationVisible(newNotification, userId, rolesRef.current)) return;

          queryClient.setQueryData<NotificationList>(queryKey, (prev) => {
            if (!prev || prev.notifications.some((n) => n.id === newNotification.id)) return prev;
            return {
              notifications: [newNotification, ...prev.notifications].slice(
                0,
                NOTIFICATION_LIST_LIMIT,
              ),
              unreadCount: prev.unreadCount + (newNotification.is_read ? 0 : 1),
            };
          });

          const prefs = getNotificationPreferences();
          if (prefs.sound) playNotificationSound();
          if (prefs.desktop) showDesktopNotification(newNotification);

          const toastType =
            newNotification.type === 'STOCK_EMPTY' || newNotification.type === 'STOCK_LOW'
              ? 'warning'
              : 'info';
          showToast(newNotification.message, toastType);
        },
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return;
        // Event selama koneksi putus hilang, jadi ambil ulang setelah reconnect
        if (hasSubscribed) queryClient.invalidateQueries({ queryKey });
        hasSubscribed = true;
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, showToast]);
}
