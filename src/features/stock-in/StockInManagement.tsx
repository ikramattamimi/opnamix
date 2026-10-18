import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Download, Plus, SearchX } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListWithPanel } from '@/components/layout/ListWithPanel';
import { Toolbar, ToolbarSpacer } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { FilterChips } from '@/components/data/FilterChips';
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
import { dayLabel, monthName, rp, rpShort } from '@/lib/format';
import { ROUTES } from '@/types/routes';
import { useAllProducts } from '@/features/products/useProducts';
import { exportStockInToExcel } from '@/features/reports/exportUtils';
import { useStockInReceipts } from './useStockIn';
import {
  ALL_SUPPLIERS,
  expiringItems,
  filterReceipts,
  receiptDate,
  receiptTime,
  stockInStats,
  supplierNames,
  totalUnits,
} from './stockInView';
import { StockInPanel } from './components/StockInPanel';

const PAGE_SIZE = 10;

const hm = (date: Date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const StockInManagement: React.FC = () => {
  const navigate = useNavigate();
  // Semua penerimaan dimuat sekaligus supaya filter, ringkasan, dan grup per hari
  // dihitung di klien (jumlahnya kecil untuk satu klinik)
  const { data, isPending, isError, refetch } = useStockInReceipts({ page: 1, perPage: 1000 });
  const receipts = useMemo(() => data?.data ?? [], [data]);
  const { data: products = [] } = useAllProducts();
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const [query, setQuery] = useState('');
  const [supplier, setSupplier] = useState(ALL_SUPPLIERS);
  const [expiring, setExpiring] = useState(false);
  const [page, setPage] = useState(1);

  const stats = useMemo(() => stockInStats(receipts), [receipts]);
  const suppliers = useMemo(() => supplierNames(receipts), [receipts]);
  const filtered = useMemo(
    () => filterReceipts(receipts, { query, supplier, expiring }),
    [receipts, query, supplier, expiring],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const groups = groupByDay(visible, receiptDate, (d) => dayLabel(d));

  const { selectedId, select, panelOpen, closePanel } = useListSelection<string>();
  const selected = receipts.find((r) => r.id === selectedId) ?? visible[0];

  const resetPage =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  const isFiltered = !!query.trim() || supplier !== ALL_SUPPLIERS || expiring;

  const list = (
    <Card className="flex flex-col gap-3 p-3">
      <Toolbar>
        <SearchInput
          value={query}
          onChange={resetPage(setQuery)}
          placeholder="Cari supplier atau nomor nota"
          label="Cari penerimaan"
        />
        <ToolbarSpacer />
        <OptionSelect
          aria-label="Supplier"
          className="w-auto max-w-full"
          value={supplier}
          onValueChange={resetPage(setSupplier)}
          options={[
            { value: ALL_SUPPLIERS, label: 'Semua supplier' },
            ...suppliers.map((s) => ({ value: s, label: s })),
          ]}
        />
      </Toolbar>
      <FilterChips
        filters={expiring ? [{ key: 'exp', label: 'Ada batch kedaluwarsa < 6 bulan' }] : []}
        onRemove={() => resetPage(setExpiring)(false)}
      />

      {isPending ? (
        <LoadingState label="Memuat penerimaan..." />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={isFiltered ? SearchX : Archive}
          title={isFiltered ? 'Tidak ada penerimaan yang cocok' : 'Belum ada penerimaan'}
          description={isFiltered ? 'Ubah kata kunci atau hapus filter.' : undefined}
        />
      ) : (
        <>
          <GroupedList
            groups={groups}
            getKey={(r) => r.id}
            renderItem={(r) => {
              const soon = expiringItems(r).length;
              return (
                <ListRow
                  lead={<Avatar name={r.supplierName} tone="neutral" />}
                  title={r.supplierName}
                  subtitle={<span className="font-mono">{r.invoiceNumber}</span>}
                  middle={`${r.items.length} produk · ${totalUnits(r).toLocaleString('id-ID')} unit`}
                  middleSub={`Diterima ${r.receivedBy} · ${hm(receiptTime(r))}`}
                  value={rp(r.total)}
                  status={
                    soon ? (
                      <StatusChip tone="warn">{soon} exp dekat</StatusChip>
                    ) : (
                      <StatusChip tone="ok">Diterima</StatusChip>
                    )
                  }
                  selected={r.id === selected?.id}
                  onClick={() => select(r.id)}
                />
              );
            }}
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

  return (
    <>
      <PageHeader
        stats={[
          {
            id: 'month',
            label: monthName(new Date().getMonth()),
            value: `${stats.monthCount} penerimaan`,
          },
          { id: 'value', label: 'Nilai pembelian', value: rpShort(stats.monthValue) },
          {
            id: 'exp',
            label: 'Kedaluwarsa < 6 bln',
            value: `${stats.expiringBatches} batch`,
            tone: 'warn',
            onClick: () => resetPage(setExpiring)(!expiring),
            pressed: expiring,
          },
        ]}
        actions={
          <>
            <Button
              variant="glass"
              onClick={() => void exportStockInToExcel(filtered)}
              disabled={filtered.length === 0}
            >
              <Download aria-hidden />
              Ekspor
            </Button>
            <Button variant="light" onClick={() => navigate(ROUTES.STOK_MASUK_BARU)}>
              <Plus aria-hidden />
              Terima barang
            </Button>
          </>
        }
      />
      <ListWithPanel
        list={list}
        panelOpen={panelOpen}
        onPanelClose={closePanel}
        panel={
          selected ? (
            <StockInPanel key={selected.id} receipt={selected} products={productMap} />
          ) : (
            <SidePanel icon={Archive} title="Detail penerimaan">
              <EmptyState title="Belum ada penerimaan dipilih" />
            </SidePanel>
          )
        }
      />
    </>
  );
};

export default StockInManagement;
