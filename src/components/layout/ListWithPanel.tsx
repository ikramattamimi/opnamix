import React, { useMemo } from 'react';
import { useEscapeKey, useFitToViewport } from '@/hooks/useFitToViewport';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { PanelContext } from '@/components/panel/panelContext';
import { cn } from '@/lib/utils';

// Daftar di kiri + panel kanan. Di layar lebar panel menempel di bawah header
// halaman; di bawah 1180px panel menjadi laci dari kanan dengan scrim.

export const PANEL_DRAWER_QUERY = '(max-width: 1180px)';

interface ListWithPanelProps {
  list: React.ReactNode;
  panel: React.ReactNode;
  /** Laci terbuka (layar sempit) */
  panelOpen: boolean;
  onPanelClose: () => void;
  className?: string;
}

export const ListWithPanel: React.FC<ListWithPanelProps> = ({
  list,
  panel,
  panelOpen,
  onPanelClose,
  className,
}) => {
  const isDrawer = useMediaQuery(PANEL_DRAWER_QUERY);
  const context = useMemo(() => ({ isDrawer, close: onPanelClose }), [isDrawer, onPanelClose]);
  const drawerOpen = isDrawer && panelOpen;
  const stickyRef = useFitToViewport<HTMLDivElement>(!isDrawer);
  useEscapeKey(drawerOpen, onPanelClose);

  return (
    <div
      className={cn(
        'grid items-start gap-3',
        !isDrawer && 'grid-cols-[minmax(0,1fr)_23.25rem]',
        className,
      )}
    >
      <div className="min-w-0">{list}</div>
      <PanelContext.Provider value={context}>
        {isDrawer ? (
          <>
            <div
              className={cn(
                'fixed inset-0 z-[55] bg-scrim transition-opacity duration-200',
                drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              onClick={onPanelClose}
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal={drawerOpen}
              aria-hidden={!drawerOpen}
              className={cn(
                'fixed inset-y-0 right-0 z-[60] flex w-[min(25rem,100%)] flex-col transition-[transform,visibility] duration-200 ease-out',
                'pb-[env(safe-area-inset-bottom,0px)] pr-[env(safe-area-inset-right,0px)]',
                '[&>section]:h-full [&>section]:rounded-none [&>section]:border-y-0 [&>section]:border-r-0',
                drawerOpen ? 'translate-x-0 shadow-float' : 'invisible translate-x-[105%]',
              )}
            >
              {panel}
            </div>
          </>
        ) : (
          <div ref={stickyRef} className="sticky top-below-header flex min-h-0 flex-col">
            {panel}
          </div>
        )}
      </PanelContext.Provider>
    </div>
  );
};
