import { describe, expect, it } from 'vitest';
import { isNotificationVisible } from './visibility';

describe('isNotificationVisible', () => {
  const userId = 'u1';
  const roles = ['admin', 'apoteker'];

  it('menampilkan notifikasi untuk user itu sendiri', () => {
    expect(isNotificationVisible({ user_id: 'u1', target_role: null }, userId, roles)).toBe(true);
  });

  it('menyembunyikan notifikasi untuk user lain, walau role cocok', () => {
    expect(isNotificationVisible({ user_id: 'u2', target_role: 'admin' }, userId, roles)).toBe(
      false,
    );
  });

  it('menampilkan notifikasi role milik user', () => {
    expect(isNotificationVisible({ user_id: null, target_role: 'apoteker' }, userId, roles)).toBe(
      true,
    );
  });

  it('menyembunyikan notifikasi role lain', () => {
    expect(isNotificationVisible({ user_id: null, target_role: 'kasir' }, userId, roles)).toBe(
      false,
    );
  });

  it('menampilkan broadcast', () => {
    expect(isNotificationVisible({ user_id: null, target_role: null }, userId, [])).toBe(true);
  });
});
