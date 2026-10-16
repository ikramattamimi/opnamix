/**
 * Efek samping untuk notifikasi baru: suara dan desktop notification.
 * Tidak tahu soal React maupun Supabase.
 */

import { AppNotification } from './types';

// Play notification sound
export function playNotificationSound() {
  try {
    const audioContext = new (
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    )();
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
}

// Request notification permission
export async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }
}

// Show desktop notification
export function showDesktopNotification(notification: AppNotification) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(notification.title, {
        body: notification.message,
        tag: `notification-${notification.id}`, // Prevents duplicate notifications
        requireInteraction: false, // Auto-dismiss after a few seconds
        silent: true, // We already have our custom sound
      });

      // Handle click to focus the app
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (error) {
      console.error('Error showing desktop notification:', error);
    }
  }
}
