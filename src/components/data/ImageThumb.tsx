import React, { useState } from 'react';
import { ExternalLink, ImageOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Gambar kecil berbingkai yang membuka ukuran penuh di tab baru (mis. foto nota).
// Tanpa `src`, atau gambar gagal dimuat, tampil kotak kosong dengan keterangan.

interface ImageThumbProps {
  src?: string | null;
  alt: string;
  /** Teks saat tidak ada gambar */
  emptyLabel?: string;
  emptyIcon?: LucideIcon;
  className?: string;
}

export const ImageThumb: React.FC<ImageThumbProps> = ({
  src,
  alt,
  emptyLabel = 'Tidak ada gambar',
  emptyIcon: EmptyIcon = ImageOff,
  className,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-xl border border-dashed border-border-strong px-3 py-2.5 text-note text-muted-foreground',
          className,
        )}
      >
        <EmptyIcon className="size-4 shrink-0" aria-hidden />
        {failed ? 'Gambar tidak bisa dimuat' : emptyLabel}
      </div>
    );
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'group relative block overflow-hidden rounded-xl border bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="max-h-48 w-full object-contain"
      />
      <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-md bg-card px-1.5 py-0.5 text-2xs font-semibold text-foreground shadow">
        <ExternalLink className="size-3" aria-hidden />
        Buka
      </span>
    </a>
  );
};
