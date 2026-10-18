import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, BellOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { ToneIcon } from '@/components/data/ToneIcon';
import { useAuth } from '@/features/auth/useAuth';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/useNotifications';
import {
  formatNotificationTime,
  getNotificationLucideIcon,
  getNotificationTarget,
  getNotificationTone,
} from '@/features/notifications/format';
import { ROUTES } from '@/types/routes';
import { cn } from '@/lib/utils';
import { HeaderIconButton } from './HeaderIconButton';

// Lonceng di header + panel notifikasi (NotificationPopover): filter, tandai
// dibaca, dan buka halaman tujuan.

type Filter = 'semua' | 'belum';
const MAX_ITEMS = 8;

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('semua');
  const { data } = useNotifications(userId);
  const { mutate: markRead } = useMarkNotificationRead(userId);
  const { mutate: markAll } = useMarkAllNotificationsRead(userId);

  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;
  const list = notifications.filter((n) => filter === 'semua' || !n.is_read).slice(0, MAX_ITEMS);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <HeaderIconButton label={unread ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'}>
          <Bell aria-hidden />
          {unread > 0 && (
            <span
              className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-dot-bad px-1 text-2xs font-bold leading-none text-on-grad"
              aria-hidden
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </HeaderIconButton>
      </PopoverTrigger>
      <PopoverContent
        data-header-popover=""
        aria-label="Notifikasi"
        className="flex max-h-[min(35rem,calc(100dvh-6rem))] w-[min(23.75rem,calc(100vw-1rem))] flex-col overflow-hidden"
      >
        <div className="flex items-center gap-2 px-3.5 pb-2 pt-3">
          <b className="text-sm">Notifikasi</b>
          {unread > 0 && <Badge variant="info">{unread} baru</Badge>}
          <span className="flex-1" />
          <Button
            variant="link"
            size="sm"
            className="h-auto px-0"
            disabled={!unread}
            onClick={() => markAll()}
          >
            Tandai semua dibaca
          </Button>
        </div>
        <div className="px-3.5 pb-2">
          <SegmentedControl<Filter>
            label="Filter notifikasi"
            full
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'semua', label: 'Semua' },
              { value: 'belum', label: 'Belum dibaca', count: unread },
            ]}
          />
        </div>
        <div className="flex flex-col gap-0.5 overflow-y-auto px-1.5 pb-1.5">
          {list.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-7 text-center text-meta text-muted-foreground">
              <ToneIcon icon={BellOff} tone="primary" size="xl" />
              <b className="text-foreground">Tidak ada notifikasi baru</b>
            </div>
          ) : (
            list.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                  go(getNotificationTarget(n.type));
                }}
                className={cn(
                  'grid w-full grid-cols-[1.625rem_minmax(0,1fr)_0.5rem] items-start gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !n.is_read && 'bg-primary/5',
                )}
              >
                <ToneIcon
                  icon={getNotificationLucideIcon(n.type)}
                  tone={getNotificationTone(n.type)}
                  size="sm"
                />
                <span className="min-w-0">
                  <b className={cn('block text-meta', n.is_read ? 'font-medium' : 'font-bold')}>
                    {n.title}
                  </b>
                  <small className="block truncate text-xs text-muted-foreground">
                    {n.message}
                  </small>
                  <span className="text-2xs text-muted-foreground">
                    {formatNotificationTime(n.created_at)}
                  </span>
                </span>
                <span
                  className={cn('mt-1.5 size-2 rounded-full bg-primary', n.is_read && 'invisible')}
                  aria-hidden
                />
                {!n.is_read && <span className="sr-only">Belum dibaca</span>}
              </button>
            ))
          )}
        </div>
        <div className="flex justify-center border-t p-1.5">
          <Button variant="ghost" onClick={() => go(ROUTES.NOTIFICATIONS)}>
            Buka semua notifikasi
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
