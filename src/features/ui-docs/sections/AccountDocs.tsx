import React, { useState } from 'react';
import { ClipboardList, TriangleAlert } from 'lucide-react';
import { ListRow } from '@/components/data/ListRow';
import { ToneIcon } from '@/components/data/ToneIcon';
import { Avatar } from '@/components/data/Avatar';
import { StatusChip } from '@/components/data/StatusChip';
import { AvatarUpload } from '@/components/form/AvatarUpload';
import { useToast } from '@/components/ui/toast';
import { RoleChips } from '@/features/users/components/RoleChips';
import { NotificationSettingRows } from '@/features/notifications/components/NotificationSettingRows';
import { DocExample, DocSection } from '../components/DocSection';

// Komponen untuk halaman Notifikasi, Kelola Pengguna, dan Profil (Fase 5)

const UnreadDot: React.FC<{ on: boolean }> = ({ on }) =>
  on ? <span className="size-2 rounded-full bg-primary" /> : <span className="size-2" />;

export const AccountDocs: React.FC = () => {
  const { showToast } = useToast();
  const [selected, setSelected] = useState(1);
  return (
    <DocSection
      id="account"
      title="Komponen akun dan notifikasi"
      description="ListRow `compact` (tanpa kolom tengah, untuk notifikasi), StatusChip dengan nada kategori (obat/bhp/imun/alkes) untuk label seperti role, AvatarUpload untuk foto profil, RoleChips (komponen domain pengguna), dan NotificationSettingRows (sakelar suara dan notifikasi desktop, disimpan per perangkat)."
      importPath="import { AvatarUpload } from '@/components/form/AvatarUpload'; import { RoleChips } from '@/features/users/components/RoleChips'; import { NotificationSettingRows } from '@/features/notifications/components/NotificationSettingRows';"
    >
      <DocExample
        title="ListRow compact (notifikasi)"
        note="Baris belum dibaca diberi latar tipis, judul tebal, dan titik biru dengan teks untuk pembaca layar."
        code={`
<ListRow
  compact
  lead={<ToneIcon icon={getNotificationLucideIcon(n.type)} tone={getNotificationTone(n.type)} />}
  title={n.title}
  subtitle={n.message}
  value={<span className="text-xs font-normal text-faint">{formatNotificationClock(n.created_at)}</span>}
  status={<UnreadDot on={!n.is_read} />}
  unread={!n.is_read}
  selected={n.id === selectedId}
  onClick={() => open(n)}
/>`}
      >
        <div className="flex w-full max-w-xl flex-col gap-0.5">
          <ListRow
            compact
            lead={<ToneIcon icon={ClipboardList} tone="info" />}
            title="Permintaan baru dari dr. Sari"
            subtitle="Budi Santoso · 3 produk · Rp 84.000"
            value={<span className="text-xs font-normal text-faint">14.32</span>}
            status={<UnreadDot on />}
            unread
            selected={selected === 0}
            onClick={() => setSelected(0)}
          />
          <ListRow
            compact
            lead={<ToneIcon icon={TriangleAlert} tone="warn" />}
            title="Amoxicillin 500 mg menipis"
            subtitle="Sisa 18 tablet, di bawah minimum 30."
            value={<span className="text-xs font-normal text-faint">13.05</span>}
            status={<UnreadDot on={false} />}
            selected={selected === 1}
            onClick={() => setSelected(1)}
          />
        </div>
      </DocExample>

      <DocExample
        title="RoleChips dan nada kategori StatusChip"
        code={`
<RoleChips roles={user.roles} />
<StatusChip tone="imun" plain>Admin</StatusChip>`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <RoleChips roles={['admin', 'farmasi', 'nakes', 'apoteker']} />
          <span className="flex gap-1">
            {(['obat', 'bhp', 'imun', 'alkes'] as const).map((tone) => (
              <StatusChip key={tone} tone={tone} plain>
                {tone}
              </StatusChip>
            ))}
          </span>
          <span className="flex gap-1">
            {(['obat', 'bhp', 'imun', 'alkes'] as const).map((tone) => (
              <Avatar key={tone} name="Rina Kartika" tone={tone} />
            ))}
          </span>
        </div>
      </DocExample>

      <DocExample
        title="AvatarUpload"
        note="Berkas langsung diteruskan ke onFileSelected; validasi tipe dan ukuran ada di halaman."
        code={`
<AvatarUpload
  name={profile.full_name}
  src={profile.avatar_url}
  tone={avatarTone(profile.id)}
  busy={uploadAvatar.isPending}
  onFileSelected={handleAvatarSelected}
/>`}
      >
        <AvatarUpload
          name="Rina Kartika"
          tone="obat"
          onFileSelected={(file) => showToast(`${file.name} dipilih (contoh).`, 'info')}
        />
      </DocExample>

      <DocExample
        title="NotificationSettingRows"
        note="Nilai disimpan di localStorage dan dibaca oleh handler realtime saat notifikasi baru masuk."
        code={`<NotificationSettingRows />`}
      >
        <div className="w-full max-w-md">
          <NotificationSettingRows />
        </div>
      </DocExample>
    </DocSection>
  );
};
