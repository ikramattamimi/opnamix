import type { StatusTone } from '@/components/data/StatusChip';
import type { UserRow } from './types';

// Role yang bisa dipilih di halaman Kelola Pengguna. 'apoteker' tidak bisa
// dipilih, tapi tetap ditampilkan kalau masih ada di data lama.
export const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin',
    tone: 'imun',
    description: 'Semua menu, termasuk kelola pengguna.',
  },
  {
    value: 'farmasi',
    label: 'Farmasi',
    tone: 'bhp',
    description: 'Pekerjaan stok harian: master data, stok masuk dan keluar, opname, laporan.',
  },
  {
    value: 'nakes',
    label: 'Nakes',
    tone: 'alkes',
    description: 'Mengajukan permintaan stok keluar dan melihat sisa stok.',
  },
] as const satisfies readonly {
  value: string;
  label: string;
  tone: StatusTone;
  description: string;
}[];

export type RoleOption = (typeof ROLE_OPTIONS)[number];
export type RoleValue = RoleOption['value'];

export const ROLE_VALUES = ROLE_OPTIONS.map((r) => r.value) as [RoleValue, ...RoleValue[]];

export const isRoleValue = (role: string): role is RoleValue => {
  return role === 'admin' || role === 'farmasi' || role === 'nakes';
};

export const getRoleOption = (role: string): RoleOption | undefined =>
  ROLE_OPTIONS.find((r) => r.value === role);

// Label dan warna untuk tampilan, termasuk role lama yang tidak bisa dipilih
export const getRoleDisplay = (role: string): { label: string; tone: StatusTone } => {
  const option = getRoleOption(role);
  if (option) return option;
  if (role === 'apoteker') return { label: 'Apoteker', tone: 'obat' };
  return { label: role, tone: 'neutral' };
};

const AVATAR_TONES = ['obat', 'bhp', 'imun', 'alkes'] as const;

// Warna avatar tetap per pengguna, diturunkan dari id
export const avatarTone = (id: string): (typeof AVATAR_TONES)[number] => {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
};

// Role awal form edit: role yang dikenal, atau role lama di profil, atau 'nakes'
export const getInitialRoles = (user: Pick<UserRow, 'roles' | 'role'>): RoleValue[] => {
  const selectedRoles = (user.roles || []).filter(isRoleValue);
  return selectedRoles.length > 0 ? selectedRoles : [(user.role || 'nakes') as RoleValue];
};

// Centang/hapus centang role. Role terakhir tidak bisa dilepas.
export const toggleRole = (roles: RoleValue[], value: RoleValue, checked: boolean): RoleValue[] => {
  if (checked) return roles.includes(value) ? roles : [...roles, value];
  const filtered = roles.filter((r) => r !== value);
  return filtered.length ? filtered : [value];
};
