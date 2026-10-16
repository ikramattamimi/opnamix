import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  updatePassword,
  updateUserProfile,
  uploadAvatar,
  type UserProfile,
} from '@/features/auth/api';
import { useAuth } from '@/features/auth/useAuth';
import { userKeys } from '@/features/users/keys';
import { profileApi } from './api';
import { profileKeys } from './keys';

// initialData diisi dari profil di state auth supaya membuka halaman profil
// tidak menambah request. Semua mutasi profil meng-invalidate key ini, jadi
// data tidak perlu dianggap basi berdasarkan waktu.
export function useProfile(userId: string | undefined, initialData?: UserProfile | null) {
  return useQuery({
    queryKey: profileKeys.detail(userId ?? ''),
    queryFn: () => profileApi.getProfile(userId!),
    enabled: !!userId,
    initialData: initialData ?? undefined,
    staleTime: Infinity,
  });
}

// Header membaca nama dan avatar dari state auth, jadi state itu ikut
// di-refresh sebelum mutasi dianggap selesai.
function useOnProfileChanged() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  return async () => {
    await refreshProfile();
    queryClient.invalidateQueries({ queryKey: profileKeys.all });
    queryClient.invalidateQueries({ queryKey: userKeys.all });
  };
}

export function useUpdateProfile() {
  const onProfileChanged = useOnProfileChanged();
  return useMutation({
    mutationFn: (payload: { userId: string; updates: Parameters<typeof updateUserProfile>[1] }) =>
      updateUserProfile(payload.userId, payload.updates),
    onSuccess: onProfileChanged,
  });
}

export function useUploadAvatar() {
  const onProfileChanged = useOnProfileChanged();
  return useMutation({
    mutationFn: (payload: { userId: string; file: File }) =>
      uploadAvatar(payload.userId, payload.file),
    onSuccess: onProfileChanged,
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (newPassword: string) => updatePassword(newPassword),
  });
}
