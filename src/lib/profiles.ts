import { supabase } from './supabaseClient';

// Nama lengkap user per id dari profiles. Id null/duplikat diabaikan.
export const getProfileNames = async (ids: (string | null)[]): Promise<Record<string, string>> => {
  const uniqueIds = [...new Set(ids.filter((id): id is string => !!id))];
  if (uniqueIds.length === 0) return {};

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', uniqueIds);
  if (error) throw error;

  const names: Record<string, string> = {};
  (data || []).forEach((profile) => {
    names[profile.id] = profile.full_name || '';
  });
  return names;
};
