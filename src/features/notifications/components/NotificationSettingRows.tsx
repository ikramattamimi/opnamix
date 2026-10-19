import React from 'react';
import { SettingRow } from '@/components/panel/SettingRow';
import { Switch } from '@/components/form/Switch';
import { requestNotificationPermission } from '../alerts';
import { setNotificationPreference, useNotificationPreferences } from '../preferences';

// Sakelar suara dan notifikasi desktop. Dipakai di panel Pengaturan halaman
// Notifikasi dan di bagian Tampilan halaman Profil.

const desktopBlocked = () => 'Notification' in window && Notification.permission === 'denied';

export const NotificationSettingRows: React.FC = () => {
  const prefs = useNotificationPreferences();

  return (
    <>
      <SettingRow
        title="Suara notifikasi"
        description="Bunyi pendek saat notifikasi baru masuk."
        control={
          <Switch
            label="Suara notifikasi"
            checked={prefs.sound}
            onCheckedChange={(on) => setNotificationPreference('sound', on)}
          />
        }
      />
      <SettingRow
        title="Notifikasi desktop"
        description={
          prefs.desktop && desktopBlocked()
            ? 'Diblokir oleh browser. Izinkan notifikasi untuk situs ini di pengaturan browser.'
            : 'Muncul di pojok layar walau sedang membuka aplikasi lain.'
        }
        control={
          <Switch
            label="Notifikasi desktop"
            checked={prefs.desktop}
            onCheckedChange={(on) => {
              setNotificationPreference('desktop', on);
              if (on) void requestNotificationPermission();
            }}
          />
        }
      />
    </>
  );
};
