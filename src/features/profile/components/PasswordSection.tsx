import React, { useState } from 'react';
import { KeyRound, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FIELD_INPUT_CLASS, FIELD_LABEL_CLASS } from './profileUi';

interface PasswordSectionProps {
  isSubmitting: boolean;
  // Validasi dan pesan ada di halaman; true kalau password berhasil diubah
  onChangePassword: (newPassword: string, confirmPassword: string) => Promise<boolean>;
}

const PasswordSection: React.FC<PasswordSectionProps> = ({ isSubmitting, onChangePassword }) => {
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const closeSection = () => {
    setShowPasswordSection(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async () => {
    if (await onChangePassword(newPassword, confirmPassword)) closeSection();
  };

  return (
    <div className="bg-card rounded-2xl shadow-soft p-6 md:p-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Lock className="text-primary size-6" aria-hidden />
          <h3 className="text-lg font-bold text-foreground">Keamanan</h3>
        </div>
        {!showPasswordSection && (
          <Button
            variant="outline"
            onClick={() => setShowPasswordSection(true)}
            className="text-sm px-4 font-bold flex items-center gap-1.5"
          >
            <KeyRound className="size-4" aria-hidden />
            Ubah Password
          </Button>
        )}
      </div>

      {showPasswordSection && (
        <div className="mt-6 space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="profile-new-password" className={FIELD_LABEL_CLASS}>
              Password Baru
            </Label>
            <Input
              id="profile-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className={FIELD_INPUT_CLASS}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-confirm-password" className={FIELD_LABEL_CLASS}>
              Konfirmasi Password
            </Label>
            <Input
              id="profile-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className={FIELD_INPUT_CLASS}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={closeSection} className="font-bold px-6">
              Batal
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="bg-primary text-white font-bold shadow-lg hover:bg-primary/90 px-6"
            >
              {isSubmitting ? 'Menyimpan...' : 'Ubah Password'}
            </Button>
          </div>
        </div>
      )}

      {!showPasswordSection && (
        <p className="text-sm text-muted-foreground mt-3">
          Pastikan menggunakan password yang kuat dan unik untuk menjaga keamanan akun Anda.
        </p>
      )}
    </div>
  );
};

export default PasswordSection;
