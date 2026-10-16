/**
 * NotificationProvider — memasang efek notifikasi untuk user yang login:
 * - meminta izin desktop notification sekali saat mount
 * - berlangganan notifikasi baru (useNotificationsRealtime), yang mengisi
 *   cache useNotifications dan memunculkan suara, desktop notification, dan toast
 *
 * Daftar notifikasi dan jumlah belum dibaca dibaca lewat useNotifications(userId).
 */

import React, { useEffect } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { requestNotificationPermission } from './alerts';
import { useNotificationsRealtime } from './useNotificationsRealtime';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || '';

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useNotificationsRealtime(userId);

  return <>{children}</>;
};

export default NotificationProvider;
