import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Mail,
  SearchX,
  Settings,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListWithPanel } from '@/components/layout/ListWithPanel';
import { Toolbar, ToolbarSpacer } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { GroupedList, ListRow } from '@/components/data/ListRow';
import { groupByDay } from '@/components/data/listGroups';
import { Pagination } from '@/components/data/Pagination';
import { ToneIcon } from '@/components/data/ToneIcon';
import { OptionSelect } from '@/components/form/OptionSelect';
import { SidePanel, PanelSection } from '@/components/panel/SidePanel';
import { DefinitionList } from '@/components/panel/DefinitionList';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useListSelection } from '@/hooks/useListSelection';
import { dayLabel, formatDateTimeForDisplay } from '@/lib/format';
import { useAuth } from '@/features/auth/useAuth';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationUnread,
  useNotifications,
} from './useNotifications';
import {
  NOTIFICATION_GROUPS,
  formatNotificationClock,
  formatNotificationTime,
  getNotificationGroup,
  getNotificationLucideIcon,
  getNotificationTarget,
  getNotificationTargetLabel,
  getNotificationTone,
  getNotificationTypeLabel,
  type NotificationGroup,
} from './format';
import { NotificationSettingRows } from './components/NotificationSettingRows';
import type { AppNotification } from './types';

type ReadFilter = 'Semua' | 'Belum' | 'Sudah';
type GroupFilter = 'Semua' | NotificationGroup;

const PAGE_SIZE = 10;

const GROUP_OPTIONS: { value: GroupFilter; label: string }[] = [
  { value: 'Semua', label: 'Semua jenis' },
  ...NOTIFICATION_GROUPS.map((g) => ({ value: g, label: g })),
];

const matchesRead = (n: AppNotification, read: ReadFilter) =>
  read === 'Semua' || (read === 'Belum') === !n.is_read;

const matchesQuery = (n: AppNotification, query: string) => {
  const q = query.trim().toLocaleLowerCase('id-ID');
  return !q || `${n.title} ${n.message}`.toLocaleLowerCase('id-ID').includes(q);
};

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { data, isPending, isError, refetch } = useNotifications(userId);
  const { mutate: markRead } = useMarkNotificationRead(userId);
  const { mutate: markUnread } = useMarkNotificationUnread(userId);
  const { mutate: markAll } = useMarkAllNotificationsRead(userId);

  const notifications = useMemo(() => data?.notifications ?? [], [data]);
  const unreadCount = data?.unreadCount ?? 0;

  const [query, setQuery] = useState('');
  const [read, setRead] = useState<ReadFilter>('Semua');
  const [group, setGroup] = useState<GroupFilter>('Semua');
  const [page, setPage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const { selectedId, select, panelOpen, openPanel, closePanel } = useListSelection<number>();
  const selected = notifications.find((n) => n.id === selectedId);

  const byGroupAndQuery = notifications.filter(
    (n) => (group === 'Semua' || getNotificationGroup(n.type) === group) && matchesQuery(n, query),
  );
  const filtered = byGroupAndQuery.filter((n) => matchesRead(n, read));
  const readCount = (r: ReadFilter) => byGroupAndQuery.filter((n) => matchesRead(n, r)).length;
  const todayKey = new Date().toDateString();
  const todayCount = notifications.filter(
    (n) => new Date(n.created_at).toDateString() === todayKey,
  ).length;

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const groups = groupByDay(
    visible,
    (n) => new Date(n.created_at),
    (d) => dayLabel(d),
  );

  const resetPage =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  const open = (n: AppNotification) => {
    setShowSettings(false);
    select(n.id);
    if (!n.is_read) markRead(n.id);
  };

  const markAllRead = () => {
    markAll();
    showToast('Semua notifikasi ditandai sudah dibaca.', 'success');
  };

  const isFiltered = !!query.trim() || read !== 'Semua' || group !== 'Semua';

  const list = (
    <Card className="flex flex-col gap-3 p-3">
      <Toolbar>
        <SearchInput
          value={query}
          onChange={resetPage(setQuery)}
          placeholder="Cari notifikasi"
          label="Cari notifikasi"
        />
        <SegmentedControl<ReadFilter>
          label="Status baca"
          options={[
            { value: 'Semua', label: 'Semua', count: readCount('Semua') },
            { value: 'Belum', label: 'Belum dibaca', count: readCount('Belum') },
            { value: 'Sudah', label: 'Sudah dibaca', count: readCount('Sudah') },
          ]}
          value={read}
          onChange={resetPage(setRead)}
        />
        <ToolbarSpacer />
        <OptionSelect
          aria-label="Jenis notifikasi"
          className="w-auto"
          value={group}
          onValueChange={resetPage(setGroup)}
          options={GROUP_OPTIONS}
        />
      </Toolbar>

      {isPending && !!userId ? (
        <LoadingState label="Memuat notifikasi..." />
      ) : isError && !data ? (
        <ErrorState title="Gagal memuat notifikasi" onRetry={() => void refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={isFiltered ? SearchX : BellOff}
          title="Tidak ada notifikasi"
          description={
            isFiltered
              ? 'Coba ubah filter untuk melihat notifikasi lain.'
              : 'Belum ada notifikasi yang masuk.'
          }
        />
      ) : (
        <>
          <GroupedList
            groups={groups}
            getKey={(n) => n.id}
            renderItem={(n) => (
              <ListRow
                compact
                lead={
                  <ToneIcon
                    icon={getNotificationLucideIcon(n.type)}
                    tone={getNotificationTone(n.type)}
                  />
                }
                title={n.title}
                subtitle={n.message}
                value={
                  <span className="text-xs font-normal text-faint">
                    {formatNotificationClock(n.created_at)}
                  </span>
                }
                status={
                  n.is_read ? (
                    <span className="size-2" aria-hidden />
                  ) : (
                    <span className="size-2 rounded-full bg-primary">
                      <span className="sr-only">Belum dibaca</span>
                    </span>
                  )
                }
                unread={!n.is_read}
                selected={!showSettings && n.id === selectedId}
                onClick={() => open(n)}
              />
            )}
          />
          <Pagination
            page={current}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
            note={`${PAGE_SIZE} per halaman`}
          />
        </>
      )}
    </Card>
  );

  let panel: React.ReactNode;
  if (showSettings) {
    panel = (
      <SidePanel
        icon={Settings}
        eyebrow="Notifikasi"
        title="Pengaturan"
        onClose={() => {
          setShowSettings(false);
          closePanel();
        }}
        footer={
          <Button
            className="sm:ml-auto"
            onClick={() => {
              setShowSettings(false);
              closePanel();
            }}
          >
            <Check aria-hidden />
            Selesai
          </Button>
        }
      >
        <PanelSection title="Berlaku di perangkat ini">
          <div>
            <NotificationSettingRows />
          </div>
        </PanelSection>
      </SidePanel>
    );
  } else if (selected) {
    const targetLabel = getNotificationTargetLabel(selected.type);
    panel = (
      <SidePanel
        icon={getNotificationLucideIcon(selected.type)}
        tone={getNotificationTone(selected.type)}
        eyebrow={`${getNotificationTypeLabel(selected.type)} · ${formatNotificationTime(selected.created_at)}`}
        title={selected.title}
        footer={
          <>
            <Button
              variant="ghost"
              disabled={!selected.is_read}
              onClick={() => markUnread(selected.id)}
            >
              <Mail aria-hidden />
              Tandai belum dibaca
            </Button>
            {targetLabel && (
              <Button
                className="sm:ml-auto"
                onClick={() => navigate(getNotificationTarget(selected.type))}
              >
                {targetLabel}
                <ArrowRight aria-hidden />
              </Button>
            )}
          </>
        }
      >
        <p className="text-label leading-relaxed">{selected.message}</p>
        <DefinitionList
          items={[
            { label: 'Jenis', value: getNotificationTypeLabel(selected.type) },
            { label: 'Waktu', value: formatDateTimeForDisplay(selected.created_at) },
          ]}
        />
      </SidePanel>
    );
  } else {
    panel = (
      <SidePanel icon={Bell} eyebrow="Notifikasi" title="Detail notifikasi">
        <EmptyState
          icon={Bell}
          title="Pilih notifikasi"
          description="Klik salah satu notifikasi untuk melihat isinya dan membuka halaman terkait."
        />
      </SidePanel>
    );
  }

  return (
    <>
      <PageHeader
        stats={[
          {
            id: 'unread',
            label: 'Belum dibaca',
            value: unreadCount,
            tone: unreadCount > 0 ? 'warn' : 'ok',
            pressed: read === 'Belum',
            onClick: () => resetPage(setRead)(read === 'Belum' ? 'Semua' : 'Belum'),
          },
          { id: 'today', label: 'Hari ini', value: todayCount },
        ]}
        actions={
          <>
            <Button
              variant="glass"
              aria-pressed={showSettings}
              onClick={() => {
                setShowSettings((v) => !v);
                openPanel();
              }}
            >
              <Settings aria-hidden />
              Pengaturan
            </Button>
            <Button variant="light" onClick={markAllRead} disabled={unreadCount === 0}>
              <CheckCheck aria-hidden />
              Tandai semua dibaca
            </Button>
          </>
        }
      />

      <ListWithPanel list={list} panel={panel} panelOpen={panelOpen} onPanelClose={closePanel} />
    </>
  );
};

export default NotificationsPage;
