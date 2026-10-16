import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './api';
import { userKeys } from './keys';
import { profileKeys } from '@/features/profile/keys';
import type { AppRole } from './types';

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: usersApi.getUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      fullName: string;
      roles: AppRole[];
    }) => usersApi.createUser(payload.email, payload.password, payload.fullName, payload.roles),
    onSuccess: () => {
      // Beri jeda supaya trigger pembuatan profil sempat jalan
      setTimeout(() => queryClient.invalidateQueries({ queryKey: userKeys.all }), 1500);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      userId: string;
      updates: { full_name: string; email: string; roles: string[] };
    }) => usersApi.updateUser(payload.userId, payload.updates),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

// Password tidak tampil di daftar, jadi tidak perlu invalidasi
export function useSetUserPassword() {
  return useMutation({
    mutationFn: (payload: { userId: string; password: string }) =>
      usersApi.setPassword(payload.userId, payload.password),
  });
}
