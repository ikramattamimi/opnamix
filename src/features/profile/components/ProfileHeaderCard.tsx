import React, { useRef } from 'react';
import { Camera, Hourglass, Loader2 } from 'lucide-react';
import type { UserProfile } from '@/features/auth/api';
import { toDate } from '@/lib/utils';
import type { RoleInfo } from './profileUi';

interface ProfileHeaderCardProps {
  profile: UserProfile;
  roleInfo: RoleInfo;
  isUploading: boolean;
  // true kalau upload dijalankan (berhasil atau gagal); input file lalu dikosongkan
  onAvatarSelected: (file: File) => Promise<boolean>;
}

const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  profile,
  roleInfo,
  isUploading,
  onAvatarSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const RoleIcon = roleInfo.icon;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await onAvatarSelected(file);
    // Reset input
    if (uploaded && fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-soft overflow-hidden">
      {/* Banner dengan Avatar di dalamnya */}
      <div className="h-40 bg-gradient-to-br from-primary via-blue-500 to-indigo-600 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40"></div>

        {/* Avatar di dalam banner */}
        <div className="absolute bottom-0 left-6 md:left-8 transform translate-y-1/2">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-card-dark shadow-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary uppercase">
                    {(profile.full_name || profile.email)?.[0] || '?'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label="Ubah foto profil"
              className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"
            >
              {isUploading ? (
                <Hourglass
                  className="text-white size-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden
                />
              ) : (
                <Camera
                  className="text-white size-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden
                />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
            />
            {isUploading && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-card-dark shadow flex items-center justify-center">
                <Loader2 className="text-primary size-3 animate-spin" aria-hidden />
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
                <RoleIcon className="size-3" aria-hidden />
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
  );
};

export default ProfileHeaderCard;
