import React, { useState } from 'react';
import { Check, KeyRound, Loader2, Trash2, UserPlus } from 'lucide-react';
import { SidePanel, PanelSection } from '@/components/panel/SidePanel';
import { DefinitionList } from '@/components/panel/DefinitionList';
import { InlineConfirm } from '@/components/panel/InlineConfirm';
import { Avatar } from '@/components/data/Avatar';
import { Field } from '@/components/form/Field';
import { CheckboxCard } from '@/components/form/CheckboxCard';
import { PasswordInput } from '@/components/form/PasswordInput';
import { generatePassword } from '@/components/form/password';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateForDisplay, formatDateTimeForDisplay } from '@/lib/format';
import { ROLE_OPTIONS, avatarTone, getInitialRoles, toggleRole } from '../roles';
import {
  createUserSchema,
  editUserSchema,
  resetPasswordSchema,
  type UserFormValues,
} from '../schema';
import type { UserRow } from '../types';
import { RoleChips } from './RoleChips';

// Panel kanan Kelola Pengguna: tambah/edit pengguna, reset password, dan hapus
// dengan konfirmasi di kaki panel.

interface UserFormPanelProps {
  /** Kosong berarti pengguna baru */
  user?: UserRow;
  /** Akun yang sedang login: tidak bisa dihapus dan role admin tidak bisa dicabut */
  isSelf: boolean;
  saving: boolean;
  deleting: boolean;
  resetting: boolean;
  onSave: (values: UserFormValues) => Promise<boolean>;
  onDelete: (user: UserRow) => Promise<boolean>;
  onResetPassword: (user: UserRow, password: string) => Promise<boolean>;
  onCancel: () => void;
}

const FORM_ID = 'user-form';

export const UserFormPanel: React.FC<UserFormPanelProps> = ({
  user,
  isSelf,
  saving,
  deleting,
  resetting,
  onSave,
  onDelete,
  onResetPassword,
  onCancel,
}) => {
  const isNew = !user;
  const empty: UserFormValues = { fullName: '', email: '', password: '', roles: ['nakes'] };
  const [values, setValues] = useState<UserFormValues>(
    user
      ? {
          fullName: user.full_name ?? '',
          email: user.email ?? '',
          password: '',
          roles: getInitialRoles(user),
        }
      : empty,
  );
  const [submitted, setSubmitted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const result = (isNew ? createUserSchema : editUserSchema).safeParse(values);
  const errors = submitted && !result.success ? result.error.flatten().fieldErrors : {};
  const resetResult = resetPasswordSchema.safeParse({ password: newPassword });
  const resetError =
    resetSubmitted && !resetResult.success ? resetResult.error.issues[0]?.message : undefined;

  const set = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!result.success) return;
    const saved = await onSave(values);
    if (saved && isNew) {
      setValues(empty);
      setSubmitted(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setResetSubmitted(true);
    if (!resetResult.success) return;
    if (await onResetPassword(user, newPassword)) {
      setResetOpen(false);
      setNewPassword('');
      setResetSubmitted(false);
    }
  };

  const busy = saving || deleting;

  const footer =
    confirmDelete && user ? (
      <InlineConfirm
        tone="danger"
        message={
          <>
            Hapus akun <b className="text-foreground">{user.full_name || user.email}</b>? Pengguna
            tidak bisa masuk lagi. Riwayat transaksi tetap tersimpan.
          </>
        }
        confirmLabel="Ya, hapus"
        confirmIcon={Trash2}
        busy={deleting}
        onConfirm={() => void onDelete(user)}
        onCancel={() => setConfirmDelete(false)}
      />
    ) : (
      <>
        {user && (
          <Button
            type="button"
            variant="ghost-danger"
            onClick={() => setConfirmDelete(true)}
            disabled={busy || isSelf}
            title={isSelf ? 'Tidak bisa menghapus akun sendiri' : undefined}
          >
            <Trash2 aria-hidden />
            Hapus
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="sm:ml-auto"
          onClick={onCancel}
          disabled={busy}
        >
          Batal
        </Button>
        <Button type="submit" form={FORM_ID} disabled={busy}>
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
          Simpan
        </Button>
      </>
    );

  return (
    <SidePanel
      icon={isNew ? UserPlus : undefined}
      eyebrow={isNew ? 'Pengguna baru' : isSelf ? 'Edit pengguna · akun Anda' : 'Edit pengguna'}
      title={
        isNew ? (
          'Tambah pengguna'
        ) : (
          <span className="flex items-center gap-2.5">
            <Avatar
              name={user.full_name || user.email}
              src={user.avatar_url}
              tone={avatarTone(user.id)}
              size="lg"
            />
            <span className="min-w-0">{user.full_name || user.email}</span>
          </span>
        )
      }
      footer={footer}
    >
      <form
        id={FORM_ID}
        noValidate
        autoComplete="off"
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-3"
      >
        <Field label="Nama lengkap" required error={errors.fullName?.[0]}>
          <Input
            value={values.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder="Nama sesuai kartu pegawai"
          />
        </Field>
        <Field
          label="Email"
          required
          error={errors.email?.[0]}
          hint={
            isNew ? 'Dipakai untuk masuk ke Opnamix.' : 'Mengubah email juga mengubah email login.'
          }
        >
          <Input
            type="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="nama@contoh.com"
          />
        </Field>
        {isNew && (
          <Field
            label="Password awal"
            required
            error={errors.password?.[0]}
            hint="Sampaikan langsung ke pengguna. Pengguna bisa menggantinya di Profil."
          >
            <PasswordInput
              value={values.password}
              onChange={(e) => set('password', e.target.value)}
              onGenerate={() => set('password', generatePassword())}
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
            />
          </Field>
        )}
        <Field label="Role · boleh lebih dari satu" error={errors.roles?.[0]}>
          <div className="flex flex-col gap-1.5">
            {ROLE_OPTIONS.map((role) => {
              const checked = values.roles.includes(role.value);
              const locked = isSelf && role.value === 'admin' && checked;
              return (
                <CheckboxCard
                  key={role.value}
                  checked={checked}
                  disabled={locked}
                  onCheckedChange={(on) => set('roles', toggleRole(values.roles, role.value, on))}
                  title={<RoleChips roles={[role.value]} />}
                  description={
                    locked
                      ? `${role.description} Anda tidak bisa mencabut role admin dari akun sendiri.`
                      : role.description
                  }
                />
              );
            })}
          </div>
        </Field>
      </form>

      {user && (
        <PanelSection title="Akun">
          <DefinitionList
            items={[
              { label: 'Dibuat', value: formatDateForDisplay(user.created_at ?? undefined) },
              {
                label: 'Diperbarui',
                value: formatDateTimeForDisplay(user.updated_at ?? undefined),
              },
            ]}
          />
          {resetOpen ? (
            <div className="flex flex-col gap-2 border-t pt-3">
              <div className="flex flex-col gap-2">
                <Field label="Password baru" error={resetError}>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onGenerate={() => setNewPassword(generatePassword())}
                    placeholder="Password baru"
                    autoComplete="new-password"
                  />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={resetting}
                    onClick={() => {
                      setResetOpen(false);
                      setNewPassword('');
                      setResetSubmitted(false);
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="button" disabled={resetting} onClick={() => void handleReset()}>
                    {resetting ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : (
                      <KeyRound aria-hidden />
                    )}
                    Simpan password
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => setResetOpen(true)}>
              <KeyRound aria-hidden />
              Reset password
            </Button>
          )}
        </PanelSection>
      )}
    </SidePanel>
  );
};
