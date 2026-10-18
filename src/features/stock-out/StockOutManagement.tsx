import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Inbox, NotebookPen, Plus, SearchX } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListWithPanel } from '@/components/layout/ListWithPanel';
import { Toolbar, ToolbarSpacer } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { GroupedList, ListRow } from '@/components/data/ListRow';
import { groupByDay } from '@/components/data/listGroups';
import { Pagination } from '@/components/data/Pagination';
import { StatusChip } from '@/components/data/StatusChip';
import { Avatar } from '@/components/data/Avatar';
import { OptionSelect } from '@/components/form/OptionSelect';
import { SidePanel } from '@/components/panel/SidePanel';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useListSelection } from '@/hooks/useListSelection';
import { dayLabel, rp, rpShort } from '@/lib/format';
import { useAuth } from '@/features/auth/useAuth';
import { getUserRoles } from '@/app/routeUtils';
import { useAllProducts } from '@/features/products/useProducts';
import { exportStockOutToExcel } from '@/features/reports/exportUtils';
import { useStockOutRequests, useStockOutRealtime } from './useStockOut';
import {
  filterRequests,
  itemSummary,
  requestTime,
  stockOutStats,
  typeLabel,
  type StatusFilter,
  type TypeFilter,
} from './stockOutView';
import { posOutPath, type PosOutState } from './navigation';
import { StockOutPanel } from './components/StockOutPanel';
import type { StockOutRequest } from './types';

const PAGE_SIZE = 10;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'Semua', label: 'Semua jenis' },
  { value: 'Permintaan', label: 'Permintaan' },
  { value: 'Manual', label: 'Manual' },
];

const hm = (date: Date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const StockOutManagement: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const userId = userProfile?.id;
  const roles = getUserRoles(userProfile);
  const isAdmin = roles.includes('admin');
  const isFarmasi = roles.includes('apoteker') || roles.includes('farmasi');
  const isNakes = roles.includes('nakes');
  const canCreateRequest = isAdmin || isNakes;
  const canManual = isAdmin || isFarmasi;
  const canProcess = isAdmin || isFarmasi;

  // Nakes hanya melihat permintaannya sendiri
  const { data, isPending, isError, refetch } = useStockOutRequests({
    page: 1,
    perPage: 1000,
    createdBy: isNakes && userId ? userId : undefined,
    nakesName: isNakes && userProfile?.full_name ? userProfile.full_name : undefined,
  });
  const requests = useMemo(() => data?.data ?? [], [data]);
  useStockOutRealtime();

  const { data: products = [] } = useAllProducts();
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const [status, setStatus] = useState<StatusFilter>('Semua');
  const [type, setType] = useState<TypeFilter>('Semua');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // Farmasi dan admin membuka antrean "Menunggu" lebih dulu (sekali saja)
  const queueInitialized = useRef(false);
  useEffect(() => {
    if (queueInitialized.current || !userProfile) return;
    queueInitialized.current = true;
    if (isAdmin || isFarmasi) setStatus('Menunggu');
  }, [userProfile, isAdmin, isFarmasi]);

  const stats = useMemo(() => stockOutStats(requests), [requests]);
  const statusCounts = useMemo(() => {
    const byType = filterRequests(requests, { status: 'Semua', type, query });
    return {
      Semua: byType.length,
      Menunggu: byType.filter((r) => r.status === 'Menunggu').length,
      Selesai: byType.filter((r) => r.status === 'Selesai').length,
    };
  }, [requests, type, query]);

  const filtered = useMemo(
    () => filterRequests(requests, { status, type, query }),
    [requests, status, type, query],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const groups = groupByDay(visible, requestTime, (d) => dayLabel(d));

  const { selectedId, select, panelOpen, closePanel } = useListSelection<string>();
  const selected = requests.find((r) => r.id === selectedId) ?? visible[0];

  const resetPage =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  const openPos = (request: StockOutRequest, intent: PosOutState['intent']) => {
    const mode = intent === 'edit' && typeLabel(request) === 'Manual' ? 'manual' : 'permintaan';
    navigate(posOutPath(mode), { state: { request, intent } satisfies PosOutState });
  };

  const isFiltered = !!query.trim() || status !== 'Semua' || type !== 'Semua';

  const list = (
    <Card className="flex flex-col gap-3 p-3">
      <Toolbar>
        <SearchInput
          value={query}
          onChange={resetPage(setQuery)}
          placeholder="Cari pasien atau nomor"
          label="Cari transaksi"
        />
        <SegmentedControl
          label="Status"
          options={(['Semua', 'Menunggu', 'Selesai'] as const).map((value) => ({
            value,
            label: value,
            count: statusCounts[value],
          }))}
          value={status}
          onChange={resetPage(setStatus)}
        />
        <ToolbarSpacer />
        <OptionSelect
          aria-label="Jenis"
          className="w-auto"
          value={type}
          onValueChange={resetPage(setType)}
          options={TYPE_OPTIONS}
        />
        <Button
          variant="outline"
          onClick={() => void exportStockOutToExcel(filtered)}
          disabled={filtered.length === 0}
        >
          <Download aria-hidden />
          Ekspor
        </Button>
      </Toolbar>

      {isPending ? (
        <LoadingState label="Memuat transaksi..." />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={isFiltered ? SearchX : Inbox}
          title={isFiltered ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'}
          description={isFiltered ? 'Ubah kata kunci atau filter.' : undefined}
        />
      ) : (
        <>
          <GroupedList
            groups={groups}
            getKey={(r) => r.id}
            renderItem={(r) => (
              <ListRow
                lead={<Avatar name={r.patient.fullName} />}
                title={r.patient.fullName || 'Tanpa nama'}
                subtitle={`${r.requestId} · ${typeLabel(r)}`}
                middle={itemSummary(r)}
                middleSub={`${r.requestedBy} · ${hm(requestTime(r))}`}
                value={rp(r.totalAmount || 0)}
                status={
                  <StatusChip tone={r.status === 'Menunggu' ? 'warn' : 'ok'}>{r.status}</StatusChip>
                }
                selected={r.id === selected?.id}
                onClick={() => select(r.id)}
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

  const panel = selected ? (
    <StockOutPanel
      key={selected.id}
      request={selected}
      products={productMap}
      canEdit={
        selected.status === 'Menunggu' &&
        (isAdmin || isFarmasi || (isNakes && selected.createdBy === userId))
      }
      canProcess={canProcess}
      canCopy={canCreateRequest}
      onEdit={() => openPos(selected, 'edit')}
      onCopy={() => openPos(selected, 'copy')}
    />
  ) : (
    <SidePanel icon={Inbox} title="Detail transaksi">
      <EmptyState title="Belum ada transaksi dipilih" />
    </SidePanel>
  );

  return (
    <>
      <PageHeader
        stats={[
          {
            id: 'wait',
            label: 'Menunggu proses',
            value: stats.waiting,
            tone: 'warn',
            onClick: () => resetPage(setStatus)(status === 'Menunggu' ? 'Semua' : 'Menunggu'),
            pressed: status === 'Menunggu',
          },
          { id: 'today', label: 'Hari ini', value: `${stats.today} transaksi` },
          { id: 'week', label: 'Keluar 7 hari', value: rpShort(stats.weekTotal) },
        ]}
        actions={
          (canManual || canCreateRequest) && (
            <>
              {canManual && (
                <Button variant="glass" onClick={() => navigate(posOutPath('manual'))}>
                  <NotebookPen aria-hidden />
                  Keluar manual
                </Button>
              )}
              {canCreateRequest && (
                <Button variant="light" onClick={() => navigate(posOutPath())}>
                  <Plus aria-hidden />
                  Buat permintaan
                </Button>
              )}
            </>
          )
        }
      />
      <ListWithPanel list={list} panel={panel} panelOpen={panelOpen} onPanelClose={closePanel} />
    </>
  );
};

export default StockOutManagement;
