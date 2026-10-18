import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/types/routes';
import { getNotificationColor, getNotificationTarget, getNotificationTone } from './format';

describe('getNotificationTone', () => {
  it('memetakan tipe ke token status', () => {
    expect(getNotificationTone('STOCK_EMPTY')).toBe('bad');
    expect(getNotificationTone('STOCK_LOW')).toBe('warn');
    expect(getNotificationTone('STOCK_OUT_PROCESSED')).toBe('ok');
    expect(getNotificationTone('TIDAK_DIKENAL')).toBe('neutral');
  });

  it('kelas warna memakai token, bukan palet Tailwind', () => {
    expect(getNotificationColor('STOCK_EMPTY')).toBe('text-bad');
    expect(getNotificationColor('TIDAK_DIKENAL')).toBe('text-muted-foreground');
  });
});

describe('getNotificationTarget', () => {
  it('membuka halaman yang sesuai dengan tipe', () => {
    expect(getNotificationTarget('STOCK_OUT_REQUEST')).toBe(ROUTES.STOK_KELUAR);
    expect(getNotificationTarget('STOCK_IN')).toBe(ROUTES.STOK_MASUK);
    expect(getNotificationTarget('OPNAME_COMPLETED')).toBe(ROUTES.STOK_OPNAME);
  });

  it('tipe tak dikenal ke halaman Notifikasi', () => {
    expect(getNotificationTarget('TIDAK_DIKENAL')).toBe(ROUTES.NOTIFICATIONS);
  });
});
