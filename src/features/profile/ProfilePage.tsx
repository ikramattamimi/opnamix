import React from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/features/auth/useAuth';
import { getRoleDisplay } from '@/features/users/roles';
import { formatDateForDisplay } from '@/lib/format';
import { getErrorMessage } from '@/lib/utils';
import { useProfile, useUpdatePassword, useUpdateProfile, useUploadAvatar } from './useProfile';
import {
  DisplaySection,
  PasswordSection,
  ProfileCard,
  ProfileInfoSection,
} from './components/ProfileSections';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const ProfilePage: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const { showToast } = useToast();
  const { data: profile, isLoading, isError, refetch } = useProfile(userProfile?.id, userProfile);
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const updatePassword = useUpdatePassword();

  if (isLoading || !profile) {
    return (
      <>
        <PageHeader />
        {isLoading ? (
          <LoadingState label="Memuat profil..." />
        ) : isError ? (
          <ErrorState title="Gagal memuat profil" onRetry={() => void refetch()} />
        ) : (
          <EmptyState title="Profil tidak ditemukan." />
        )}
      </>
    );
  }

  const roles = profile.roles?.length ? profile.roles : profile.role ? [profile.role] : [];

  const handleSaveProfile = async (fullName: string) => {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, updates: { full_name: fullName } });
      showToast('Profil disimpan.', 'success');
      return true;
    } catch (err) {
      showToast('Gagal menyimpan profil: ' + getErrorMessage(err), 'error');
      return false;
    }
  };

  const handleAvatarSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Berkas harus berupa gambar (JPG, PNG, dll.).', 'error');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      showToast('Ukuran foto maksimal 2 MB.', 'error');
      return;
    }
    try {
      await uploadAvatar.mutateAsync({ userId: profile.id, file });
      showToast('Foto profil diperbarui.', 'success');
    } catch (err) {
      showToast('Gagal mengunggah foto: ' + getErrorMessage(err), 'error');
    }
  };

  const handleChangePassword = async (password: string, confirm: string) => {
    if (!password || !confirm) return 'Isi password baru dua kali.';
    if (password.length < 6) return 'Password baru minimal 6 karakter.';
    if (password !== confirm) return 'Password baru dan ulangannya tidak sama.';
    try {
      await updatePassword.mutateAsync(password);
      showToast('Password diganti.', 'success');
      return null;
    } catch (err) {
      return 'Gagal mengganti password: ' + getErrorMessage(err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      showToast('Gagal keluar: ' + getErrorMessage(err), 'error');
    }
  };

  return (
    <>
      <PageHeader
        stats={[
          {
            id: 'role',
            label: 'Role',
            value: roles.map((r) => getRoleDisplay(r).label).join(', '),
          },
          {
            id: 'updated',
            label: 'Diperbarui',
            value: formatDateForDisplay(profile.updated_at ?? undefined),
          },
        ]}
      />

      <div className="mx-auto grid max-w-5xl items-start gap-3 md:grid-cols-[17rem_minmax(0,1fr)]">
        <ProfileCard
          profile={profile}
          roles={roles}
          uploading={uploadAvatar.isPending}
          onAvatarSelected={(file) => void handleAvatarSelected(file)}
          onLogout={() => void handleLogout()}
        />
        <div className="flex min-w-0 flex-col gap-3">
          <ProfileInfoSection
            key={profile.full_name ?? ''}
            profile={profile}
            saving={updateProfile.isPending}
            onSave={handleSaveProfile}
          />
          <PasswordSection
            saving={updatePassword.isPending}
            onChangePassword={handleChangePassword}
          />
          <DisplaySection />
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
