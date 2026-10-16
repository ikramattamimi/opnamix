import { describe, expect, it } from 'vitest';
import { createUserSchema, editUserSchema, resetPasswordSchema } from './schema';

const valid = {
  fullName: 'Budi Santoso',
  email: 'budi@contoh.com',
  password: 'rahasia',
  roles: ['nakes'],
};

// Pesan error pertama per field, seperti yang ditampilkan form
const firstErrors = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) => {
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    const key = String(issue.path[0]);
    errors[key] ??= issue.message;
  }
  return errors;
};

describe('createUserSchema', () => {
  it('menerima data lengkap', () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true);
  });

  it('menerima beberapa role sekaligus', () => {
    expect(createUserSchema.safeParse({ ...valid, roles: ['admin', 'farmasi'] }).success).toBe(
      true,
    );
  });

  it('menolak field wajib yang kosong dengan pesan per field', () => {
    const result = createUserSchema.safeParse({ ...valid, fullName: '', email: '', password: '' });
    expect(result.success).toBe(false);
    expect(firstErrors(result)).toEqual({
      fullName: 'Nama wajib diisi.',
      email: 'Email wajib diisi.',
      password: 'Password wajib diisi.',
    });
  });

  it('menolak password kurang dari 6 karakter', () => {
    const result = createUserSchema.safeParse({ ...valid, password: '12345' });
    expect(firstErrors(result)).toEqual({ password: 'Password minimal 6 karakter.' });
    expect(createUserSchema.safeParse({ ...valid, password: '123456' }).success).toBe(true);
  });

  it('menolak daftar role kosong', () => {
    const result = createUserSchema.safeParse({ ...valid, roles: [] });
    expect(firstErrors(result)).toEqual({ roles: 'Pilih minimal satu role.' });
  });

  it('menolak role yang tidak dikenal', () => {
    expect(createUserSchema.safeParse({ ...valid, roles: ['superadmin'] }).success).toBe(false);
  });
});

describe('editUserSchema', () => {
  it('tidak mewajibkan password', () => {
    expect(editUserSchema.safeParse({ ...valid, password: '' }).success).toBe(true);
  });

  it('menolak email tanpa @', () => {
    const result = editUserSchema.safeParse({ ...valid, email: 'budi.contoh.com' });
    expect(firstErrors(result)).toEqual({ email: 'Email tidak valid.' });
  });

  it('menolak email kosong dan nama kosong', () => {
    const result = editUserSchema.safeParse({ ...valid, email: '', fullName: '' });
    expect(firstErrors(result)).toEqual({
      email: 'Email tidak valid.',
      fullName: 'Nama wajib diisi.',
    });
  });
});

describe('resetPasswordSchema', () => {
  it('menerima password apa pun yang tidak kosong', () => {
    expect(resetPasswordSchema.safeParse({ password: 'a' }).success).toBe(true);
  });

  it('menolak password kosong', () => {
    const result = resetPasswordSchema.safeParse({ password: '' });
    expect(firstErrors(result)).toEqual({ password: 'Password baru wajib diisi.' });
  });
});
