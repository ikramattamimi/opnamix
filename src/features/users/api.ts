import { supabase } from '@/lib/supabaseClient';
import type { UserProfile } from '@/features/auth/api';
import type { AppRole, UserRow } from './types';

/**
 * Call the admin-users Edge Function (service role key stays server-side).
 * The function rejects callers who are not logged in as admin.
 */
async function invokeAdminUsers<T = unknown>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body });

  if (error) {
    // FunctionsHttpError carries the Response; surface the server's message
    const response = (error as { context?: Response }).context;
    if (response && typeof response.json === 'function') {
      const payload = await response.json().catch(() => null);
      if (payload?.error) throw new Error(payload.error);
    }
    throw error;
  }

  return data as T;
}

export const usersApi = {
  // Semua profil beserta daftar role dari user_roles, terbaru dulu.
  // RLS allows any logged-in user to read profiles and user_roles
  getUsers: async (): Promise<UserRow[]> => {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (profileError) throw profileError;
    if (userRolesError) throw userRolesError;

    const rolesMap = (userRoles || []).reduce<Record<string, string[]>>((acc, item) => {
      if (!item.user_id || !item.role) return acc;
      if (!acc[item.user_id]) {
        acc[item.user_id] = [];
      }
      if (!acc[item.user_id].includes(item.role)) {
        acc[item.user_id].push(item.role);
      }
      return acc;
    }, {});

    return (profiles || []).map((p) => ({
      ...p,
      roles: rolesMap[p.id] || (p.role ? [p.role] : []),
    }));
  },

  /**
   * Create new user (admin only)
   * Email is auto-confirmed by the admin-users Edge Function
   */
  createUser: async (
    email: string,
    password: string,
    fullName: string,
    roleOrRoles: AppRole | AppRole[],
  ) => {
    const roles = Array.from(new Set(Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]));

    return invokeAdminUsers<{ id: string }>({ action: 'create', email, password, fullName, roles });
  },

  /**
   * Update user profile, login email and roles (admin only)
   */
  updateUser: async (
    userId: string,
    updates: { full_name: string; email: string; roles: string[] },
  ) => {
    return invokeAdminUsers<UserProfile>({
      action: 'update',
      userId,
      fullName: updates.full_name,
      email: updates.email,
      roles: updates.roles,
    });
  },

  /**
   * Delete user from auth.users (admin only)
   * Profile will be cascade-deleted by database trigger/policy
   */
  deleteUser: async (userId: string) => {
    await invokeAdminUsers({ action: 'delete', userId });
  },

  /**
   * Update user password directly (admin only)
   * Sets the password without the email reset flow
   */
  setPassword: async (userId: string, newPassword: string) => {
    await invokeAdminUsers({ action: 'set_password', userId, password: newPassword });
  },
};
