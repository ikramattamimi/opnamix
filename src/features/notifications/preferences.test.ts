import { describe, expect, it } from 'vitest';
import { parseNotificationPreferences } from './preferences';

describe('parseNotificationPreferences', () => {
  it('memakai bawaan (semua nyala) kalau belum tersimpan atau rusak', () => {
    expect(parseNotificationPreferences(null)).toEqual({ sound: true, desktop: true });
    expect(parseNotificationPreferences('{rusak')).toEqual({ sound: true, desktop: true });
    expect(parseNotificationPreferences('"teks"')).toEqual({ sound: true, desktop: true });
  });

  it('membaca nilai tersimpan dan mengisi yang kosong dengan bawaan', () => {
    expect(parseNotificationPreferences('{"sound":false}')).toEqual({
      sound: false,
      desktop: true,
    });
    expect(parseNotificationPreferences('{"sound":true,"desktop":"ya"}')).toEqual({
      sound: true,
      desktop: true,
    });
  });
});
