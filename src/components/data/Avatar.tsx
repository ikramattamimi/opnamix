import React, { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';

// Inisial berwarna atau foto. Foto hanya dari URL http(s).

const avatarVariants = cva(
  'grid shrink-0 place-items-center overflow-hidden rounded-full font-bold',
  {
    variants: {
      tone: {
        primary: 'bg-primary-soft text-primary-ink',
        ok: 'bg-ok-soft text-ok',
        warn: 'bg-warn-soft text-warn',
        bad: 'bg-bad-soft text-bad',
        obat: 'bg-cat-obat/15 text-cat-obat',
        imun: 'bg-cat-imun/15 text-cat-imun',
        bhp: 'bg-cat-bhp/15 text-cat-bhp',
        alkes: 'bg-cat-alkes/15 text-cat-alkes',
        neutral: 'bg-surface-2 text-muted-foreground',
      },
      size: {
        sm: 'size-7.5 text-2xs',
        md: 'size-8 text-xs',
        lg: 'size-10 text-meta',
        xl: 'size-22 text-[1.75rem]',
      },
    },
    defaultVariants: { tone: 'primary', size: 'md' },
  },
);

const isHttpUrl = (url?: string | null): url is string => {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name?: string | null;
  src?: string | null;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, tone, size, className }) => {
  const [failed, setFailed] = useState(false);
  const showImage = isHttpUrl(src) && !failed;
  return (
    <span className={cn(avatarVariants({ tone, size }), className)} aria-hidden>
      {showImage ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
};
