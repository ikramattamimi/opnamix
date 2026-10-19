import React, { useId, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, type AvatarProps } from '@/components/data/Avatar';

// Avatar besar dengan tombol kamera untuk mengganti foto. Berkas langsung
// diteruskan ke onFileSelected (validasi dan unggah di pemanggil), lalu isian
// dikosongkan supaya berkas yang sama bisa dipilih lagi.

interface AvatarUploadProps {
  name?: string | null;
  src?: string | null;
  tone?: AvatarProps['tone'];
  busy?: boolean;
  onFileSelected: (file: File) => void;
  label?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  name,
  src,
  tone,
  busy,
  onFileSelected,
  label = 'Ganti foto profil',
}) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <Avatar name={name} src={src} tone={tone} size="xl" />
      <label
        htmlFor={id}
        title={label}
        className="absolute -bottom-0.5 -right-0.5 grid size-8 cursor-pointer place-items-center rounded-full border-[3px] border-card bg-primary text-primary-foreground transition-colors hover:bg-primary/90 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:disabled]:cursor-wait [&_svg]:size-3.5"
      >
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/*"
          aria-label={label}
          disabled={busy}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileSelected(file);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
      </label>
    </div>
  );
};
