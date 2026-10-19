import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, CalendarCog, ClipboardCheck, ClipboardX, Play, Timer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassTile } from '@/components/layout/GlassTile';
import { ListWithPanel } from '@/components/layout/ListWithPanel';
import { SidePanel } from '@/components/panel/SidePanel';
import { Toolbar } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { GroupedList, ListRow } from '@/components/data/ListRow';
import type { ListGroup } from '@/components/data/listGroups';
import { Pagination } from '@/components/data/Pagination';
import { StatusChip } from '@/components/data/StatusChip';
import { SignedValue } from '@/components/data/SignedValue';
import { ToneIcon } from '@/components/data/ToneIcon';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useDateRange } from '@/hooks/useDateRange';
import { monthName } from '@/lib/format';
import { getErrorMessage } from '@/lib/utils';
import { opnamePath } from '@/types/routes';
import { useAllProducts } from '@/features/products/useProducts';
import { CATEGORY_META } from '@/features/products/catalog';
import {
  FREQUENCY_LABEL,
  daysUntil,
  nextRun,
  runStats,
  scheduleScope,
  scopeLabel,
  scopeProductIds,
  timeLabel,
} from './catalog';
import { inRange, lastOpnamedAt } from './summary';
import {
  useActiveOpnames,
  useDeleteOpnameSchedule,
  useOpnameHistory,
  useOpnameRealtime,
  useOpnameSchedules,
  useSaveOpnameSchedule,
  useStartOpname,
  useToggleOpnameSchedule,
} from './useOpname';
import { OpnameSummary } from './components/OpnameSummary';
import {
  HistoryPanel,
  ScheduleFormPanel,
  SchedulesPanel,
  StartPanel,
  UpcomingPanel,
} from './components/OpnamePanels';
import type { OpnameRun, OpnameSchedule } from './types';

type Filter = 'Semua' | 'Terjadwal' | 'Selesai' | 'Ada selisih';

type Mode =
  | { kind: 'none' }
  | { kind: 'detail'; id: string }
  | { kind: 'sched'; id: string }
  | { kind: 'jadwal' }
  | { kind: 'jadwal-edit'; id?: string }
  | { kind: 'mulai'; scheduleId?: string };

type Row =
  | { kind: 'sched'; key: string; schedule: OpnameSchedule; date: Date }
  | { kind: 'hist'; key: string; run: OpnameRun; date: Date };

const PAGE_SIZE = 10;
const shortDay = (d: Date) => `${d.getDate()} ${monthName(d.getMonth()).slice(0, 3)}`;
const clock = (d: Date) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const categoryLabel = (c: keyof typeof CATEGORY_META) => CATEGORY_META[c]?.short ?? c;

const StokOpnamePage: React.FC = () => {
  useOpnameRealtime();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const historyQuery = useOpnameHistory();
  const { data: active = [] } = useActiveOpnames();
  const { data: schedules = [] } = useOpnameSchedules();
  const { data: products = [] } = useAllProducts();
  const startOpname = useStartOpname();
  const saveSchedule = useSaveOpnameSchedule();
  const deleteSchedule = useDeleteOpnameSchedule();
  const toggleSchedule = useToggleOpnameSchedule();

  const history = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  const range = useDateRange('30');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Semua');
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode>({ kind: 'none' });
  const [panelOpen, setPanelOpen] = useState(false);

  const open = (next: Mode) => {
    setMode(next);
    setPanelOpen(true);
  };
  const close = () => {
    setMode({ kind: 'none' });
    setPanelOpen(false);
  };

  const locked = useMemo(() => {
    const map = new Map<string, string>();
    for (const run of active) for (const i of run.items) map.set(i.product.id, run.name);
    return map;
  }, [active]);
  const lastOpnamed = useMemo(() => lastOpnamedAt(history), [history]);

  const upcoming = useMemo(
    () =>
      schedules
        .map((s) => ({ schedule: s, date: nextRun(s) }))
        .filter((x): x is { schedule: OpnameSchedule; date: Date } => !!x.date)
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [schedules],
  );
  const { from, to } = range.range;
  const histInRange = history.filter((r) => inRange(r, from, to));
  const hasDiff = (r: OpnameRun) => runStats(r.items).diff > 0;

  const q = query.trim().toLocaleLowerCase('id-ID');
  const matches = (text: string) => !q || text.toLocaleLowerCase('id-ID').includes(q);
  const rows: Row[] = [
    ...(filter === 'Semua' || filter === 'Terjadwal'
      ? upcoming
          .filter((u) => matches(u.schedule.nama))
          .map((u) => ({ kind: 'sched' as const, key: `s-${u.schedule.id}`, ...u }))
      : []),
    ...(filter === 'Terjadwal'
      ? []
      : histInRange
          .filter((r) => (filter !== 'Ada selisih' || hasDiff(r)) && matches(`${r.name} ${r.code}`))
          .map((r) => ({
            kind: 'hist' as const,
            key: r.id,
            run: r,
            date: new Date(r.completedAt ?? r.startedAt),
          }))),
  ];

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const groups: ListGroup<Row>[] = [];
  for (const row of visible) {
    const label =
      row.kind === 'sched'
        ? 'Terjadwal'
        : `${monthName(row.date.getMonth())} ${row.date.getFullYear()}`;
    const last = groups[groups.length - 1];
    if (last?.key === label) last.items.push(row);
    else groups.push({ key: label, label, items: [row] });
  }

  const resetPage =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  const start = async (input: {
    name: string;
    scheduleId: string | null;
    productIds: string[];
  }) => {
    try {
      const id = await startOpname.mutateAsync(input);
      showToast(`${input.productIds.length} produk dikunci. Mulai menghitung.`, 'success');
      navigate(opnamePath(id, 'hitung'));
    } catch (err) {
      showToast('Gagal memulai opname: ' + getErrorMessage(err), 'error');
    }
  };

  const up30 = upcoming.filter((u) => daysUntil(u.date) <= 30).length;
  const isFiltered = !!q || filter !== 'Semua';

  const list = (
    <Card className="flex flex-col gap-3 p-3">
      <Toolbar>
        <SearchInput
          value={query}
          onChange={resetPage(setQuery)}
          placeholder="Cari nama atau kode opname"
          label="Cari opname"
        />
        <SegmentedControl<Filter>
          label="Filter"
          value={filter}
          onChange={resetPage(setFilter)}
          options={[
            { value: 'Semua', label: 'Semua' },
            { value: 'Terjadwal', label: 'Terjadwal', count: upcoming.length },
            { value: 'Selesai', label: 'Selesai', count: histInRange.length },
            {
              value: 'Ada selisih',
              label: 'Ada selisih',
              count: histInRange.filter(hasDiff).length,
            },
          ]}
        />
      </Toolbar>

      {historyQuery.isPending ? (
        <LoadingState label="Memuat opname..." />
      ) : historyQuery.isError ? (
        <ErrorState onRetry={() => void historyQuery.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardX}
          title={isFiltered ? 'Tidak ada opname yang cocok' : 'Belum ada opname'}
          description={`Opname selesai disaring sesuai rentang di ringkasan selisih (${range.range.label}).`}
        />
      ) : (
        <>
          <GroupedList
            groups={groups}
            getKey={(r) => r.key}
            renderItem={(r) => {
              if (r.kind === 'sched') {
                const scope = scheduleScope(r.schedule);
                const days = daysUntil(r.date);
                return (
                  <ListRow
                    lead={<ToneIcon icon={CalendarClock} tone="obat" />}
                    title={r.schedule.nama}
                    subtitle={`${HARI[r.date.getDay()]}, ${shortDay(r.date)} · ${timeLabel(r.schedule)}`}
                    middle={`${scopeProductIds(scope, products).length} produk`}
                    middleSub={`${FREQUENCY_LABEL[r.schedule.pengulangan]} · ${scopeLabel(scope, categoryLabel)}`}
                    value={
                      <span className="font-medium text-muted-foreground">
                        {days <= 0 ? 'Hari ini' : `${days} hari lagi`}
                      </span>
                    }
                    status={<StatusChip tone="info">Terjadwal</StatusChip>}
                    selected={mode.kind === 'sched' && mode.id === r.schedule.id}
                    onClick={() => open({ kind: 'sched', id: r.schedule.id })}
                  />
                );
              }
              const s = runStats(r.run.items);
              return (
                <ListRow
                  lead={<ToneIcon icon={ClipboardCheck} tone={s.diff ? 'warn' : 'ok'} />}
                  title={r.run.name}
                  subtitle={`${r.run.code} · ${shortDay(r.date)}`}
                  middle={`${s.n} produk dihitung`}
                  middleSub={`${r.run.auditor} · ${clock(r.date)}`}
                  value={<SignedValue value={s.net} currency zero="Rp 0" />}
                  status={
                    s.diff ? (
                      <StatusChip tone="warn">{s.diff} selisih</StatusChip>
                    ) : (
                      <StatusChip tone="ok">Sesuai</StatusChip>
                    )
                  }
                  selected={mode.kind === 'detail' && mode.id === r.run.id}
                  onClick={() => open({ kind: 'detail', id: r.run.id })}
                />
              );
            }}
          />
          <Pagination
            page={current}
            pageSize={PAGE_SIZE}
            total={rows.length}
            onPageChange={setPage}
            note={`${PAGE_SIZE} per halaman`}
          />
        </>
      )}
    </Card>
  );

  let panel: React.ReactNode;
  const detailRun = mode.kind === 'detail' ? history.find((r) => r.id === mode.id) : undefined;
  const upcomingItem =
    mode.kind === 'sched' ? upcoming.find((u) => u.schedule.id === mode.id) : undefined;
  const editSchedule =
    mode.kind === 'jadwal-edit' && mode.id ? schedules.find((s) => s.id === mode.id) : undefined;

  if (detailRun) {
    panel = (
      <HistoryPanel
        run={detailRun}
        onReport={() => navigate(opnamePath(detailRun.id, 'laporan'))}
      />
    );
  } else if (upcomingItem) {
    const ids = scopeProductIds(scheduleScope(upcomingItem.schedule), products);
    const clashId = ids.find((id) => locked.has(id));
    panel = (
      <UpcomingPanel
        schedule={upcomingItem.schedule}
        date={upcomingItem.date}
        productIds={ids}
        clash={
          clashId ? active.find((r) => r.items.some((i) => i.product.id === clashId)) : undefined
        }
        starting={startOpname.isPending}
        onEdit={() => open({ kind: 'jadwal-edit', id: upcomingItem.schedule.id })}
        onStart={() =>
          void start({ name: '', scheduleId: upcomingItem.schedule.id, productIds: ids })
        }
      />
    );
  } else if (mode.kind === 'jadwal') {
    panel = (
      <SchedulesPanel
        schedules={schedules}
        products={products}
        onEdit={(s) => open({ kind: 'jadwal-edit', id: s.id })}
        onNew={() => open({ kind: 'jadwal-edit' })}
        onToggle={(s, isActive) =>
          toggleSchedule.mutate(
            { id: s.id, isActive },
            {
              onError: (err) =>
                showToast('Gagal mengubah jadwal: ' + getErrorMessage(err), 'error'),
            },
          )
        }
        onClose={close}
      />
    );
  } else if (mode.kind === 'jadwal-edit') {
    panel = (
      <ScheduleFormPanel
        key={mode.id ?? 'new'}
        schedule={editSchedule}
        products={products}
        saving={saveSchedule.isPending}
        deleting={deleteSchedule.isPending}
        onCancel={() => open({ kind: 'jadwal' })}
        onSave={(config) =>
          saveSchedule.mutate(
            { id: editSchedule?.id, config },
            {
              onSuccess: () => {
                showToast(editSchedule ? 'Jadwal disimpan.' : 'Jadwal ditambahkan.', 'success');
                open({ kind: 'jadwal' });
              },
              onError: (err) =>
                showToast('Gagal menyimpan jadwal: ' + getErrorMessage(err), 'error'),
            },
          )
        }
        onDelete={(s) =>
          deleteSchedule.mutate(s.id, {
            onSuccess: () => {
              showToast(`${s.nama} dihapus.`, 'success');
              open({ kind: 'jadwal' });
            },
            onError: (err) => showToast('Gagal menghapus jadwal: ' + getErrorMessage(err), 'error'),
          })
        }
      />
    );
  } else if (mode.kind === 'mulai') {
    panel = (
      <StartPanel
        schedules={schedules}
        products={products}
        locked={locked}
        lastOpnamed={lastOpnamed}
        initialScheduleId={mode.scheduleId}
        starting={startOpname.isPending}
        onStart={(input) => void start(input)}
        onCancel={close}
      />
    );
  } else {
    panel = (
      <SidePanel icon={ClipboardCheck} eyebrow="Stok opname" title="Detail opname">
        <EmptyState
          icon={ClipboardCheck}
          title="Pilih opname"
          description="Klik jadwal untuk memulainya, atau opname selesai untuk melihat hasilnya."
        />
      </SidePanel>
    );
  }

  return (
    <>
      <PageHeader
        stats={[{ id: 'up30', label: 'Terjadwal 30 hari', value: up30 }]}
        actions={
          <>
            <Button
              variant="glass"
              aria-pressed={mode.kind === 'jadwal' || mode.kind === 'jadwal-edit'}
              onClick={() => open({ kind: 'jadwal' })}
            >
              <CalendarCog aria-hidden />
              Jadwal
            </Button>
            <Button variant="light" onClick={() => open({ kind: 'mulai' })}>
              <Play aria-hidden />
              Mulai opname
            </Button>
          </>
        }
      >
        {active.map((run) => {
          const s = runStats(run.items);
          return (
            <GlassTile
              key={run.id}
              icon={Timer}
              title={`Sedang berjalan · ${run.name}`}
              subtitle={`${run.code} · dimulai ${clock(new Date(run.startedAt))} oleh ${run.auditor} · ${s.n} produk dikunci dari transaksi`}
              progress={{ label: 'Dihitung', value: s.counted, max: s.n }}
              action={
                <Button variant="light" onClick={() => navigate(opnamePath(run.id, 'hitung'))}>
                  <Play aria-hidden />
                  Lanjutkan
                </Button>
              }
            />
          );
        })}
      </PageHeader>

      <div className="flex flex-col gap-3">
        <OpnameSummary history={history} range={range} />
        <ListWithPanel list={list} panel={panel} panelOpen={panelOpen} onPanelClose={close} />
      </div>
    </>
  );
};

export default StokOpnamePage;
