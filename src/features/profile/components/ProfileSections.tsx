import React, { useState } from 'react';
import { Check, KeyRound, Loader2, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/form/Field';
import { PasswordInput } from '@/components/form/PasswordInput';
import { AvatarUpload } from '@/components/form/AvatarUpload';
import { SettingRow } from '@/components/panel/SettingRow';
import { DefinitionList } from '@/components/panel/DefinitionList';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { useTheme } from '@/app/providers/ThemeProvider';
import type { SizePreference, ThemePreference } from '@/app/providers/displayPreferences';
import type { UserProfile } from '@/features/auth/api';
import { RoleChips } from '@/features/users/components/RoleChips';
import { avatarTone } from '@/features/users/roles';
import { NotificationSettingRows } from '@/features/notifications/components/NotificationSettingRows';
import { formatDateForDisplay, formatDateTimeForDisplay } from '@/lib/format';

// Bagian halaman Profil: kartu identitas (kiri) dan tiga bagian pengaturan (kanan).

const Section: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-panel">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">{children}</CardContent>
  </Card>
);

const SectionActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex justify-end">{children}</div>
);

export const ProfileCard: React.FC<{
  profile: UserProfile;
  roles: string[];
  uploading: boolean;
  onAvatarSelected: (file: File) => void;
  onLogout: () => void;
}> = ({ profile, roles, uploading, onAvatarSelected, onLogout }) => (
  <Card className="flex flex-col items-center gap-3 px-4 pb-4 pt-5 text-center md:sticky md:top-below-header">
    <AvatarUpload
      name={profile.full_name || profile.email}
      src={profile.avatar_url}
      tone={avatarTone(profile.id)}
      busy={uploading}
      onFileSelected={onAvatarSelected}
    />
    <div className="min-w-0">
      <h2 className="text-panel font-bold">{profile.full_name || 'Belum diatur'}</h2>
      <p className="mt-0.5 break-words text-meta text-muted-foreground">{profile.email}</p>
    </div>
    <RoleChips roles={roles} className="justify-center" />
    <div className="w-full border-t pt-3 text-left">
      <DefinitionList
        items={[
          { label: 'Bergabung', value: formatDateForDisplay(profile.created_at ?? undefined) },
          {
            label: 'Diperbarui',
            value: formatDateTimeForDisplay(profile.updated_at ?? undefined),
          },
        ]}
      />
    </div>
    <Button variant="outline" className="w-full" onClick={onLogout}>
      <LogOut aria-hidden />
      Keluar
    </Button>
  </Card>
);

export const ProfileInfoSection: React.FC<{
  profile: UserProfile;
  saving: boolean;
  onSave: (fullName: string) => Promise<boolean>;
}> = ({ profile, saving, onSave }) => {
  const [name, setName] = useState(profile.full_name ?? '');
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && !name.trim() ? 'Nama tidak boleh kosong.' : undefined;
  const unchanged = name.trim() === (profile.full_name ?? '');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!name.trim()) return;
    if (await onSave(name.trim())) setSubmitted(false);
  };

  return (
    <Section
      title="Informasi profil"
      description="Nama ini tampil di permintaan, penerimaan, dan riwayat transaksi."
    >
      <form noValidate onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama lengkap" required error={error}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" hint="Email dan role hanya bisa diubah oleh admin.">
            <Input value={profile.email ?? ''} readOnly />
          </Field>
        </div>
        <SectionActions>
          <Button type="submit" disabled={saving || unchanged}>
            {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
            Simpan profil
          </Button>
        </SectionActions>
      </form>
    </Section>
  );
};

export const PasswordSection: React.FC<{
  saving: boolean;
  /** Mengembalikan pesan galat, atau null kalau berhasil */
  onChangePassword: (password: string, confirm: string) => Promise<string | null>;
}> = ({ saving, onChangePassword }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = await onChangePassword(password, confirm);
    setError(message);
    if (!message) {
      setPassword('');
      setConfirm('');
    }
  };

  return (
    <Section
      title="Keamanan"
      description="Ganti password secara berkala, terutama bila komputer dipakai bergantian."
    >
      <form noValidate onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Password baru" hint="Minimal 6 karakter.">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Ulangi password" error={error ?? undefined}>
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ketik ulang password baru"
              autoComplete="new-password"
            />
          </Field>
        </div>
        <SectionActions>
          <Button type="submit" disabled={saving || !password}>
            {saving ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
            Ganti password
          </Button>
        </SectionActions>
      </form>
    </Section>
  );
};

const THEME_SEGMENTS = [
  { value: 'light', label: 'Terang', icon: Sun },
  { value: 'system', label: 'Sistem', icon: Monitor },
  { value: 'dark', label: 'Gelap', icon: Moon },
] as const satisfies readonly { value: ThemePreference; label: string; icon: typeof Sun }[];

const SIZE_SEGMENTS = [
  { value: 'standar', label: 'Standar' },
  { value: 'besar', label: 'Besar' },
] as const satisfies readonly { value: SizePreference; label: string }[];

export const DisplaySection: React.FC = () => {
  const { theme, setTheme, size, setSize } = useTheme();
  return (
    <Section title="Tampilan dan notifikasi" description="Berlaku untuk perangkat ini.">
      <div>
        <SettingRow
          title="Tema"
          description="Sistem mengikuti pengaturan komputer."
          control={
            <SegmentedControl<ThemePreference>
              label="Tema"
              options={THEME_SEGMENTS}
              value={theme}
              onChange={setTheme}
            />
          }
        />
        <SettingRow
          title="Ukuran tampilan"
          description="Besar menaikkan teks dan tombol sekitar 15%."
          control={
            <SegmentedControl<SizePreference>
              label="Ukuran tampilan"
              options={SIZE_SEGMENTS}
              value={size}
              onChange={setSize}
            />
          }
        />
        <NotificationSettingRows />
      </div>
    </Section>
  );
};
