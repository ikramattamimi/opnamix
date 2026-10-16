import React, { useState } from 'react';
import { BellOff, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/useAuth';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from './useNotifications';
import { getNotificationLucideIcon, getNotificationColor, formatNotificationTime } from './format';
import { AppNotification } from './types';

const TYPE_LABELS: Record<string, string> = {
  STOCK_OUT_REQUEST: 'Permintaan Stok Keluar',
  STOCK_OUT_PROCESSED: 'Stok Keluar Diproses',
  STOCK_LOW: 'Stok Menipis',
  STOCK_EMPTY: 'Stok Habis',
  OPNAME_STARTED: 'Opname Dimulai',
  OPNAME_COMPLETED: 'Opname Selesai',
  OPNAME_CREATED: 'Opname Dibuat',
  OPNAME_STEP_CHANGED: 'Tahap Opname Berubah',
  STOCK_IN: 'Stok Masuk',
  STOCK_OUT_DIRECT: 'Stok Keluar Langsung',
  OPNAME_DISCREPANCY: 'Selisih Opname',
  PRODUCT_ADDED: 'Produk Ditambahkan',
  PRODUCT_DELETED: 'Produk Dihapus',
  SERVICE_ADDED: 'Jasa Ditambahkan',
};

const ALL_TYPES = ['Semua', ...Object.keys(TYPE_LABELS)];

const FILTER_CHIP_CLASS = 'h-auto px-3 py-1.5 rounded-lg text-xs font-bold transition-colors';
const FILTER_CHIP_IDLE_CLASS =
  'bg-background-light dark:bg-background-dark text-text-secondary-light hover:bg-background-light dark:hover:bg-background-dark hover:text-text-primary-light dark:hover:text-white';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';
  const { data, isLoading, isError, refetch } = useNotifications(userId);
  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const { mutate: markAsRead } = useMarkNotificationRead(userId);
  const { mutate: markAll } = useMarkAllNotificationsRead(userId);
  const markAllAsRead = () => markAll();
  const [filterType, setFilterType] = useState('Semua');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

  const filtered = notifications.filter((n) => {
    const typeMatch = filterType === 'Semua' || n.type === filterType;
    const readMatch =
      filterRead === 'all' ||
      (filterRead === 'unread' && !n.is_read) ||
      (filterRead === 'read' && n.is_read);
    return typeMatch && readMatch;
  });

  const handleMarkRead = (notif: AppNotification) => {
    if (!notif.is_read) markAsRead(notif.id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-white">Notifikasi</h1>
          <p className="text-sm text-text-secondary-light mt-1">
            {unreadCount > 0
              ? `${unreadCount} notifikasi belum dibaca`
              : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            onClick={markAllAsRead}
            className="text-sm font-bold text-primary hover:text-primary/80 border border-primary/20 hover:border-primary/40 rounded-xl px-4 py-2 h-auto"
          >
            <CheckCheck className="size-4 mr-1.5" aria-hidden />
            Tandai semua dibaca
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-soft space-y-3">
        {/* Read filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'unread', 'read'] as const).map((opt) => (
            <Button
              key={opt}
              variant="ghost"
              size="sm"
              aria-pressed={filterRead === opt}
              onClick={() => setFilterRead(opt)}
              className={cn(
                FILTER_CHIP_CLASS,
                filterRead === opt
                  ? 'bg-primary text-white hover:bg-primary hover:text-white dark:hover:bg-primary'
                  : FILTER_CHIP_IDLE_CLASS,
              )}
            >
              {opt === 'all' ? 'Semua' : opt === 'unread' ? 'Belum Dibaca' : 'Sudah Dibaca'}
            </Button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2 flex-wrap">
          {ALL_TYPES.map((type) => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              aria-pressed={filterType === type}
              onClick={() => setFilterType(type)}
              className={cn(
                FILTER_CHIP_CLASS,
                filterType === type
                  ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/10'
                  : FILTER_CHIP_IDLE_CLASS,
              )}
            >
              {type === 'Semua' ? 'Semua Tipe' : TYPE_LABELS[type] || type}
            </Button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-soft overflow-hidden">
        {isLoading ? (
          <LoadingState label="Memuat notifikasi..." className="py-16" />
        ) : isError && !data ? (
          <ErrorState
            title="Gagal memuat notifikasi"
            onRetry={() => void refetch()}
            className="py-16 px-4"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="Tidak ada notifikasi"
            description={
              filterType !== 'Semua' || filterRead !== 'all'
                ? 'Coba ubah filter untuk melihat notifikasi lain.'
                : 'Belum ada notifikasi yang masuk.'
            }
            className="py-16 px-4"
          />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleMarkRead(notif)}
                className={`w-full text-left px-5 py-4 flex gap-4 items-start transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                  !notif.is_read ? 'bg-purple-50/40 dark:bg-purple-900/10' : ''
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-white/5`}
                >
                  <NotificationIcon type={notif.type} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-snug ${!notif.is_read ? 'font-bold text-text-primary-light dark:text-white' : 'font-medium text-text-secondary-light dark:text-text-secondary-dark'}`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                        {notif.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {!notif.is_read && <span className="w-2.5 h-2.5 bg-primary rounded-full" />}
                      <span className="text-[10px] text-text-secondary-light/60 dark:text-text-secondary-dark/60 whitespace-nowrap">
                        {formatNotificationTime(notif.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Type badge */}
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">
                    {TYPE_LABELS[notif.type] || notif.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-text-secondary-light/60">
          Menampilkan {filtered.length} dari {notifications.length} notifikasi
        </p>
      )}
    </div>
  );
};

const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
  const Icon = getNotificationLucideIcon(type);
  return <Icon className={`size-5 ${getNotificationColor(type)}`} aria-hidden />;
};

export default NotificationsPage;
