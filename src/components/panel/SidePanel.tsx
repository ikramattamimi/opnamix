import React from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { ToneIcon, type Tone } from '@/components/data/ToneIcon';
import { cn } from '@/lib/utils';
import { usePanelContext } from './panelContext';

// Panel kanan: kepala (ikon, eyebrow, judul, badge, tutup), isi yang bisa
// digulir, dan kaki untuk tombol aksi. Dipakai di dalam ListWithPanel.

export interface SidePanelProps {
  icon?: LucideIcon;
  tone?: Tone;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  badge?: React.ReactNode;
  /** Bawaan: menutup laci dari ListWithPanel */
  onClose?: () => void;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  icon,
  tone = 'primary',
  eyebrow,
  title,
  badge,
  onClose,
  footer,
  children,
  className,
}) => {
  const panel = usePanelContext();
  const close = onClose ?? panel.close;
  const showClose = !!close && (panel.isDrawer || !!onClose);

  return (
    <section
      className={cn(
        'flex max-h-full min-h-0 flex-col overflow-hidden rounded-card border bg-card shadow',
        className,
      )}
    >
      <header className="flex items-start gap-2.5 border-b px-3.5 pb-3 pt-3.5">
        {icon && <ToneIcon icon={icon} tone={tone} size="lg" />}
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h3 className="mt-px text-panel font-bold leading-snug text-balance">{title}</h3>
        </div>
        {badge}
        {showClose && (
          <button
            type="button"
            onClick={close}
            aria-label="Tutup panel"
            className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
          >
            <X aria-hidden />
          </button>
        )}
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3.5">{children}</div>
      {footer && (
        <footer className="flex items-center gap-2 border-t bg-card px-3.5 py-2.5 [&>*]:flex-1 sm:[&>*]:flex-none">
          {footer}
        </footer>
      )}
    </section>
  );
};

// Judul kecil di dalam panel, opsional dengan aksi di kanan
export const PanelSection: React.FC<{
  title: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ title, action, children }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
      <span>{title}</span>
      {action}
    </div>
    {children}
  </div>
);
