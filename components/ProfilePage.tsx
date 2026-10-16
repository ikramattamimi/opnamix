import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { updateUserProfile, uploadAvatar, updatePassword } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage, toDate } from '../lib/utils';

const ROLE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  admin: {
    label: 'Admin',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    icon: 'admin_panel_settings',
  },
  apoteker: {
    label: 'Farmasi',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    icon: 'medication',
  },
  farmasi: {
    label: 'Farmasi',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    icon: 'medication',
  },
  nakes: {
    label: 'Nakes',
    color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    icon: 'health_and_safety',
  },
};

const ProfilePage: React.FC = () => {
  const { userProfile: profile, refreshProfile } = useAuth();
  const [isLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formName, setFormName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await updateUserProfile(profile.id, { full_name: formName.trim() });
      await refreshProfile();
      setEditMode(false);
      setSuccess('Profil berhasil diperbarui!');
    } catch (err) {
      setError('Gagal menyimpan: ' + getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, dll).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran foto maksimal 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      await uploadAvatar(profile.id, file);
      await refreshProfile();
      setSuccess('Foto profil berhasil diperbarui!');
    } catch (err) {
      setError('Gagal upload foto: ' + getErrorMessage(err));
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Semua field password wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(newPassword);
      setSuccess('Password berhasil diubah!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err) {
      setError('Gagal mengubah password: ' + getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="material-icons-round text-primary text-4xl animate-spin">refresh</span>
          <p className="mt-2 text-sm text-text-secondary-light">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-text-secondary-light">Profil tidak ditemukan.</p>
      </div>
    );
  }

  const userRoles = profile?.roles ?? (profile?.role ? [profile.role] : []);
  const primaryRole = userRoles.includes('admin')
    ? 'admin'
    : userRoles.includes('apoteker')
      ? 'apoteker'
      : userRoles.includes('farmasi')
        ? 'farmasi'
        : userRoles.includes('nakes')
          ? 'nakes'
          : userRoles[0] || 'nakes';
  const roleInfo = ROLE_LABELS[primaryRole] || ROLE_LABELS.nakes;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-[fadeIn_0.3s]">
          <span className="material-icons-round text-base">error</span>
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-[fadeIn_0.3s]">
          <span className="material-icons-round text-base">check_circle</span>
          {success}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-soft overflow-hidden">
        {/* Banner dengan Avatar di dalamnya */}
        <div className="h-40 bg-gradient-to-br from-primary via-blue-500 to-indigo-600 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40"></div>

          {/* Avatar di dalam banner */}
          <div className="absolute bottom-0 left-6 md:left-8 transform translate-y-1/2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-card-dark shadow-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary uppercase">
                      {(profile.full_name || profile.email)?.[0] || '?'}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-icons-round text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? 'hourglass_top' : 'camera_alt'}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {isUploading && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-card-dark shadow flex items-center justify-center">
                  <span className="material-icons-round text-primary text-xs animate-spin">
                    refresh
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Info - di bawah banner */}
        <div className="px-6 md:px-8 pt-16 pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-text-primary-light dark:text-white">
                {profile.full_name || 'Belum diatur'}
              </h2>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {profile.email}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${roleInfo.color}`}
                >
                  <span className="material-icons-round text-xs">{roleInfo.icon}</span>
                  {roleInfo.label}
                </span>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Bergabung{' '}
                  {toDate(profile.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Section */}
      <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-soft p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-primary">account_circle</span>
            <h3 className="text-lg font-bold text-text-primary-light dark:text-white">
              Informasi Profil
            </h3>
          </div>
          {!editMode ? (
            <Button
              variant="outline"
              onClick={() => {
                setEditMode(true);
                setFormName(profile.full_name || '');
              }}
              className="rounded-xl text-sm h-auto py-2 px-4 font-bold flex items-center gap-1.5"
            >
              <span className="material-icons-round text-sm">edit</span>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setFormName(profile.full_name || '');
                }}
                className="rounded-xl text-sm h-auto py-2 px-4 font-bold"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSubmitting}
                className="rounded-xl text-sm h-auto py-2 px-4 font-bold bg-primary text-white hover:bg-blue-700"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-text-secondary-light dark:text-text-secondary-dark">
              Nama Lengkap
            </label>
            {editMode ? (
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            ) : (
              <p className="text-sm font-medium text-text-primary-light dark:text-white px-4 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
                {profile.full_name || '-'}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-text-secondary-light dark:text-text-secondary-dark">
              Email
            </label>
            <p className="text-sm font-medium text-text-primary-light dark:text-white px-4 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
              {profile.email}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-text-secondary-light dark:text-text-secondary-dark">
              Role
            </label>
            <p className="text-sm font-medium text-text-primary-light dark:text-white px-4 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center gap-2">
              <span
                className={`material-icons-round text-base ${userRoles.includes('admin') ? 'text-purple-500' : userRoles.includes('apoteker') || userRoles.includes('farmasi') ? 'text-blue-500' : 'text-green-500'}`}
              >
                {roleInfo.icon}
              </span>
              {roleInfo.label}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-text-secondary-light dark:text-text-secondary-dark">
              Terakhir Diperbarui
            </label>
            <p className="text-sm font-medium text-text-primary-light dark:text-white px-4 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
              {profile.updated_at
                ? new Date(profile.updated_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-soft p-6 md:p-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-primary">lock</span>
            <h3 className="text-lg font-bold text-text-primary-light dark:text-white">Keamanan</h3>
          </div>
          {!showPasswordSection && (
            <Button
              variant="outline"
              onClick={() => setShowPasswordSection(true)}
              className="rounded-xl text-sm h-auto py-2 px-4 font-bold flex items-center gap-1.5"
            >
              <span className="material-icons-round text-sm">key</span>
              Ubah Password
            </Button>
          )}
        </div>

        {showPasswordSection && (
          <div className="mt-6 space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-text-secondary-light dark:text-text-secondary-dark">
                Password Baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-text-secondary-light dark:text-text-secondary-dark">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordSection(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="rounded-xl font-bold h-auto py-2.5 px-6"
              >
                Batal
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={isSubmitting}
                className="bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 h-auto py-2.5 px-6"
              >
                {isSubmitting ? 'Menyimpan...' : 'Ubah Password'}
              </Button>
            </div>
          </div>
        )}

        {!showPasswordSection && (
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-3">
            Pastikan menggunakan password yang kuat dan unik untuk menjaga keamanan akun Anda.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
