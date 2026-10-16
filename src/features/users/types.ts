import type { Tables } from '@/lib/database.types';

export type AppRole = 'admin' | 'nakes' | 'apoteker' | 'farmasi';

export type UserRow = Tables<'profiles'> & {
  roles: string[];
  last_sign_in_at?: string | null;
};
