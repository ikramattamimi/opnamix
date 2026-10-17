import React, { useState, useEffect } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { useProfile, useUpdateProfile, useUploadAvatar, useUpdatePassword } from './useProfile';
import { useAuth } from '@/features/auth/useAuth';
import { getErrorMessage } from '@/lib/utils';
import { getRoleIconColor, getRoleInfo } from './components/profileUi';
import ProfileHeaderCard from './components/ProfileHeaderCard';
import ProfileInfoSection from './components/ProfileInfoSection';
import PasswordSection from './components/PasswordSection';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';

const ProfilePage: React.FC = () => {
  const { userProfile } = useAuth();
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useProfile(userProfile?.id, userProfile);
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const updatePassword = useUpdatePassword();
  const [editMode, setEditMode] = useState(false);
  const [formName, setFormName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormName(profile.full_name || '');
    }
  }, [profile]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSaveProfile = async () => {
    if (!profile || !formName.trim()) {
      setError('Nama tidak boleh kosong.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        userId: profile.id,
        updates: { full_name: formName.trim() },
      });
      setEditMode(false);
      setSuccess('Profil berhasil diperbarui!');
    } catch (err) {
      setError('Gagal menyimpan: ' + getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarSelected = async (file: File): Promise<boolean> => {
    if (!profile) return false;

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, dll).');
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran foto maksimal 2MB.');
      return false;
    }

    setIsUploading(true);
    try {
      await uploadAvatar.mutateAsync({ userId: profile.id, file });
      setSuccess('Foto profil berhasil diperbarui!');
    } catch (err) {
      setError('Gagal upload foto: ' + getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
    return true;
  };

  const handleChangePassword = async (
    newPassword: string,
    confirmPassword: string,
  ): Promise<boolean> => {
    if (!newPassword || !confirmPassword) {
      setError('Semua field password wajib diisi.');
      return false;
    }
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi tidak cocok.');
      return false;
    }

    setIsSubmitting(true);
    try {
      await updatePassword.mutateAsync(newPassword);
      setSuccess('Password berhasil diubah!');
      return true;
    } catch (err) {
      setError('Gagal mengubah password: ' + getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProfileLoading) {
    return <LoadingState label="Memuat profil..." className="min-h-[400px]" />;
  }

  if (!profile) {
    if (isProfileError) {
      return (
        <ErrorState
          title="Gagal memuat profil"
          onRetry={() => void refetchProfile()}
          className="min-h-[400px]"
        />
      );
    }
    return <EmptyState title="Profil tidak ditemukan." className="min-h-[400px]" />;
  }

  const userRoles = profile?.roles ?? (profile?.role ? [profile.role] : []);
  const roleInfo = getRoleInfo(userRoles);

  return (
    <PageLayout maxWidth="narrow">
      <PageHeader
        title="Akun Saya"
        description="Lihat dan perbarui data profil serta kata sandi Anda."
      />

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-center gap-2 animate-[fadeIn_0.3s]">
          <CircleAlert className="size-5" aria-hidden />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl flex items-center gap-2 animate-[fadeIn_0.3s]">
          <CircleCheck className="size-5" aria-hidden />
          {success}
        </div>
      )}

      <ProfileHeaderCard
        profile={profile}
        roleInfo={roleInfo}
        isUploading={isUploading}
        onAvatarSelected={handleAvatarSelected}
      />

      <ProfileInfoSection
        profile={profile}
        roleInfo={roleInfo}
        roleIconColor={getRoleIconColor(userRoles)}
        editMode={editMode}
        onEditModeChange={setEditMode}
        formName={formName}
        onFormNameChange={setFormName}
        isSubmitting={isSubmitting}
        onSave={() => void handleSaveProfile()}
      />

      <PasswordSection isSubmitting={isSubmitting} onChangePassword={handleChangePassword} />
    </PageLayout>
  );
};

export default ProfilePage;
