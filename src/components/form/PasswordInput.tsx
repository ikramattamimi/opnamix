import React, { useState } from 'react';
import { Eye, EyeOff, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Isian password dengan tombol tampil/sembunyikan dan (opsional) buat acak
type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  /** Kalau diisi, muncul tombol untuk membuat password acak */
  onGenerate?: () => void;
};

const ICON_BTN =
  'grid size-6.5 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5';

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ onGenerate, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn(
            'flex h-8 w-full rounded-control border border-input bg-card pl-2.5 text-meta text-foreground placeholder:text-faint focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 aria-[invalid=true]:border-bad',
            onGenerate ? 'pr-16' : 'pr-9',
            className,
          )}
          {...props}
        />
        <div className="absolute right-0.5 top-1/2 flex -translate-y-1/2 gap-px">
          {onGenerate && (
            <button
              type="button"
              className={ICON_BTN}
              onClick={() => {
                onGenerate();
                setVisible(true);
              }}
              aria-label="Buat password acak"
              title="Buat password acak"
            >
              <Wand2 aria-hidden />
            </button>
          )}
          <button
            type="button"
            className={ICON_BTN}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </button>
        </div>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
