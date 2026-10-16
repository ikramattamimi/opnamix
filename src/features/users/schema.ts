import { z } from 'zod';
import { ROLE_VALUES } from './roles';

const fullName = z.string().min(1, 'Nama wajib diisi.');
const roles = z.array(z.enum(ROLE_VALUES)).min(1, 'Pilih minimal satu role.');

// Tambah pengguna: email, nama, dan password wajib; password minimal 6 karakter
export const createUserSchema = z.object({
  fullName,
  email: z.string().min(1, 'Email wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.').min(6, 'Password minimal 6 karakter.'),
  roles,
});

// Edit pengguna: password tidak dipakai, email harus mengandung '@'
export const editUserSchema = createUserSchema.extend({
  email: z.string().refine((value) => value.includes('@'), 'Email tidak valid.'),
  password: z.string(),
});

export type UserFormValues = z.infer<typeof createUserSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(1, 'Password baru wajib diisi.'),
});

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
