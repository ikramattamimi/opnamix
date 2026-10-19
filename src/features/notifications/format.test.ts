import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/types/routes';
import {
  getNotificationColor,
  getNotificationGroup,
  getNotificationTarget,
  getNotificationTargetLabel,
  getNotificationTone,
} from './format';

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

describe('getNotificationGroup', () => {
  it('mengelompokkan tipe untuk filter', () => {
    expect(getNotificationGroup('STOCK_OUT_DIRECT')).toBe('Transaksi');
    expect(getNotificationGroup('STOCK_IN')).toBe('Transaksi');
    expect(getNotificationGroup('STOCK_LOW')).toBe('Stok');
    expect(getNotificationGroup('OPNAME_DISCREPANCY')).toBe('Opname');
    expect(getNotificationGroup('SERVICE_ADDED')).toBe('Master data');
    expect(getNotificationGroup('TIDAK_DIKENAL')).toBeNull();
  });
});

describe('getNotificationTargetLabel', () => {
  it('memberi teks tombol sesuai halaman tujuan', () => {
    expect(getNotificationTargetLabel('STOCK_IN')).toBe('Buka Stok Masuk');
    expect(getNotificationTargetLabel('TIDAK_DIKENAL')).toBeNull();
  });
});
