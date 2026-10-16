import { supabase } from '@/lib/supabaseClient';
import type { UserProfile } from '@/features/auth/api';

export const profileApi = {
  // Profil satu user beserta daftar role dari user_roles
  getProfile: async (userId: string): Promise<UserProfile> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;

    const { data: userRolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles = userRolesData?.map((r) => r.role) || (data.role ? [data.role] : []);

    return { ...data, roles };
  },
};
