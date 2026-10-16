/**
 * NotificationProvider — React context for real-time notifications
 *
 * Provides:
 * - notifications[]       — list of recent notifications
 * - unreadCount           — number of unread notifications
 * - markAsRead(id)        — mark a single notification as read
 * - markAllAsRead()       — mark all notifications as read
 * - isOpen / setIsOpen    — notification panel open state
 *
 * Subscribes to Supabase Realtime INSERT events on the notifications table.
 * Triggers toast popups for new notifications.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
} from '../lib/notifications';
import { useToast } from './ui/toast';
import { AppNotification } from '../types';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  setIsOpen: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  isLoading: true,
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const userId = user?.id || '';
  const userRoles = userProfile?.roles ?? (userProfile?.role ? [userProfile.role] : []);
  const userRolesRef = useRef(userRoles);

  // Keep ref in sync with current roles to avoid stale closure
  useEffect(() => {
    userRolesRef.current = userRoles;
  }, [userRoles]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const channelRef = useRef<any>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const [data, count] = await Promise.all([
        getNotifications(userId, userRoles),
        getUnreadCount(userId, userRoles),
      ]);
      setNotifications(data);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userRoles]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Pleasant notification tone (two beeps)
      oscillator.frequency.value = 800; // First tone
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

      // Second beep
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 1000; // Higher tone
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.1);
      }, 150);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  }, []);

  // Show desktop notification
  const showDesktopNotification = useCallback((notification: AppNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(notification.title, {
          body: notification.message,
          // icon: '/favicon.ico', // You can customize this
          // badge: '/favicon.ico',
          tag: `notification-${notification.id}`, // Prevents duplicate notifications
          requireInteraction: false, // Auto-dismiss after a few seconds
          silent: true, // We already have our custom sound
        });

        // Optional: Handle click to focus the app
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (error) {
        console.error('Error showing desktop notification:', error);
      }
    }
  }, []);

  // Request permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Subscribe to realtime changes
  useEffect(() => {
    fetchNotifications();

    // Set up Supabase Realtime subscription
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

          // Check if this notification is relevant to the current user
          // Use ref for userRoles to avoid stale closure issues
          const isForUser = newNotification.user_id === userId;
          const isForRole =
            newNotification.user_id === null &&
            userRolesRef.current.includes(newNotification.target_role);
          const isBroadcast =
            newNotification.user_id === null && newNotification.target_role === null;

          if (isForUser || isForRole || isBroadcast) {
            // Add to top of list
            setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
            setUnreadCount((prev) => prev + 1);

            // Play notification sound
            playNotificationSound();

            // Show desktop notification
            showDesktopNotification(newNotification);

            // Show toast popup
            const toastType =
              newNotification.type === 'STOCK_EMPTY' || newNotification.type === 'STOCK_LOW'
                ? 'warning'
                : 'info';
            showToast(newNotification.message, toastType);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [
    userId,
    userRoles,
    fetchNotifications,
    showToast,
    playNotificationSound,
    showDesktopNotification,
  ]);

  // Mark single notification as read
  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    await apiMarkAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    await apiMarkAllAsRead(userId, userRoles);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [userId, userRoles]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        setIsOpen,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
        isLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
