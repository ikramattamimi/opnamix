import React from 'react';
import { CircleUserRound, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserProfile } from '@/features/auth/api';
import { FIELD_INPUT_CLASS, FIELD_LABEL_CLASS, type RoleInfo } from './profileUi';

interface ProfileInfoSectionProps {
  profile: UserProfile;
  roleInfo: RoleInfo;
  roleIconColor: string;
  editMode: boolean;
  onEditModeChange: (editMode: boolean) => void;
  formName: string;
  onFormNameChange: (name: string) => void;
  isSubmitting: boolean;
  onSave: () => void;
}

const ProfileInfoSection: React.FC<ProfileInfoSectionProps> = ({
  profile,
  roleInfo,
  roleIconColor,
  editMode,
  onEditModeChange,
  formName,
  onFormNameChange,
  isSubmitting,
  onSave,
}) => {
  const RoleIcon = roleInfo.icon;

  return (
    <div className="bg-card rounded-2xl shadow-soft p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <CircleUserRound className="text-primary size-6" aria-hidden />
          <h3 className="text-lg font-bold text-foreground">Informasi Profil</h3>
        </div>
        {!editMode ? (
          <Button
            variant="outline"
            onClick={() => {
              onEditModeChange(true);
              onFormNameChange(profile.full_name || '');
            }}
            className="rounded-xl text-sm h-auto py-2 px-4 font-bold flex items-center gap-1.5"
          >
            <Pencil className="size-4" aria-hidden />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onEditModeChange(false);
                onFormNameChange(profile.full_name || '');
              }}
              className="rounded-xl text-sm h-auto py-2 px-4 font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={onSave}
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
          <Label htmlFor="profile-full-name" className={FIELD_LABEL_CLASS}>
            Nama Lengkap
          </Label>
          {editMode ? (
            <Input
              id="profile-full-name"
              type="text"
              value={formName}
              onChange={(e) => onFormNameChange(e.target.value)}
              className={FIELD_INPUT_CLASS}
            />
          ) : (
            <p className="text-sm font-medium text-foreground px-4 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
              {profile.full_name || '-'}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className={FIELD_LABEL_CLASS}>Email</Label>
          <p className="text-sm font-medium text-foreground px-4 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
            {profile.email}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className={FIELD_LABEL_CLASS}>Role</Label>
          <p className="text-sm font-medium text-foreground px-4 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center gap-2">
            <RoleIcon className={`size-5 ${roleIconColor}`} aria-hidden />
            {roleInfo.label}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className={FIELD_LABEL_CLASS}>Terakhir Diperbarui</Label>
          <p className="text-sm font-medium text-foreground px-4 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
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
  );
};

export default ProfileInfoSection;
