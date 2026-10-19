import React, { useMemo, useState } from 'react';
import { BriefcaseMedical, Download, Plus, SearchX, Tags } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListWithPanel } from '@/components/layout/ListWithPanel';
import { Toolbar } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { ResponsiveGrid } from '@/components/data/ResponsiveGrid';
import { ItemCard } from '@/components/data/ItemCard';
import { Pagination } from '@/components/data/Pagination';
import { StatusChip } from '@/components/data/StatusChip';
import { ToneIcon } from '@/components/data/ToneIcon';
import { OptionSelect } from '@/components/form/OptionSelect';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useGridPageSize } from '@/hooks/useGridPageSize';
import { useListSelection } from '@/hooks/useListSelection';
import { rp } from '@/lib/format';
import { exportServicesToExcel } from '@/features/reports/exportUtils';
import {
  useAllServices,
  useCreateService,
  useDeleteService,
  useUpdateService,
} from './useServices';
import { useCreateServiceCategory, useServiceCategories } from './useServiceCategories';
import { NO_CATEGORY, serviceCategoryMeta, serviceMatches } from './catalog';
import { generateServiceCode, type ServiceFormValues } from './serviceSchema';
import { ServiceCategoryPanel, ServiceFormPanel } from './components/ServicePanels';
import type { Service } from './types';

const ALL = 'Semua';
const NONE = 'none';
const GRID_ROWS = 3;

const ServiceManagement: React.FC = () => {
  const { showToast } = useToast();
  const { data: services = [], isPending, isError, refetch } = useAllServices();
  const { data: categories = [] } = useServiceCategories();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const createCategory = useCreateServiceCategory();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [managingCategories, setManagingCategories] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);
  const [formKey, setFormKey] = useState(0);

  // selectedId kosong = panel "Tambah jasa"
  const { selectedId, select, panelOpen, openPanel, closePanel, setSelectedId } =
    useListSelection<string>();
  const selected = services.find((s) => s.id === selectedId);

  const grid = useGridPageSize(220, GRID_ROWS);

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of services) {
      const key = s.categoryId ?? NONE;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [services]);

  const filtered = useMemo(
    () =>
      services.filter(
        (s) =>
          (category === ALL || (s.categoryId ?? NONE) === category) && serviceMatches(s, query),
      ),
    [services, category, query],
  );

  const pages = Math.max(1, Math.ceil(filtered.length / grid.pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * grid.pageSize, current * grid.pageSize);
  const average = services.length
    ? services.reduce((sum, s) => sum + s.price, 0) / services.length
    : 0;

  const categoryOptions = [
    { value: ALL, label: 'Semua kategori' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
    ...(usage.has(NONE) ? [{ value: NONE, label: NO_CATEGORY }] : []),
  ];

  const startNew = () => {
    setManagingCategories(false);
    setSelectedId(null);
    openPanel();
  };

  const handleSave = async (values: ServiceFormValues) => {
    const data: Partial<Service> = {
      name: values.name.trim(),
      code: selected?.code ?? generateServiceCode(values.name),
      categoryId: values.categoryId,
      price: values.price,
    };
    try {
      if (selected) {
        await updateService.mutateAsync({ id: selected.id, updates: data });
        showToast('Perubahan jasa disimpan.', 'success');
      } else {
        await createService.mutateAsync(data);
        showToast(`${data.name} ditambahkan.`, 'success');
      }
      return true;
    } catch (error) {
      console.error('Error saving service:', error);
      showToast('Gagal menyimpan jasa', 'error');
      return false;
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      const created = await createCategory.mutateAsync({ name });
      showToast(`Kategori "${created.name}" ditambahkan.`, 'success');
      return true;
    } catch (error) {
      console.error('Error creating service category:', error);
      showToast('Gagal menambahkan kategori', 'error');
      return false;
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteService.mutateAsync(toDelete.id);
      showToast(`${toDelete.name} dihapus.`, 'success');
      setToDelete(null);
      select(null);
      closePanel();
    } catch (error) {
      console.error('Error deleting service:', error);
      showToast('Gagal menghapus jasa', 'error');
    }
  };

  const isFiltered = !!query.trim() || category !== ALL;

  const list = (
    <Card className="flex flex-col gap-3 p-3">
      <Toolbar>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Cari nama atau kode jasa"
          label="Cari jasa"
        />
        <OptionSelect
          aria-label="Kategori jasa"
          className="w-auto"
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
          options={categoryOptions}
        />
      </Toolbar>

      {isPending ? (
        <LoadingState label="Memuat jasa..." />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <>
          <ResponsiveGrid ref={grid.ref} cols={grid.cols}>
            {visible.map((s) => {
              const meta = serviceCategoryMeta(s.categoryName);
              return (
                <ItemCard
                  key={s.id}
                  topStart={
                    <>
                      <ToneIcon icon={meta.icon} tone={meta.tone} />
                      <span className="truncate font-mono text-2xs text-faint">{s.code}</span>
                    </>
                  }
                  title={s.name}
                  footer={
                    <>
                      <StatusChip tone="neutral" plain className="min-w-0 truncate">
                        {s.categoryName ?? NO_CATEGORY}
                      </StatusChip>
                      <b>{rp(s.price)}</b>
                    </>
                  }
                  selected={!managingCategories && s.id === selectedId}
                  onClick={() => {
                    setManagingCategories(false);
                    select(s.id);
                  }}
                />
              );
            })}
          </ResponsiveGrid>
          {filtered.length === 0 && (
            <EmptyState
              icon={isFiltered ? SearchX : BriefcaseMedical}
              title={isFiltered ? 'Tidak ada jasa yang cocok' : 'Belum ada jasa'}
              description={isFiltered ? 'Ubah kata kunci atau kategori.' : undefined}
            />
          )}
          <Pagination
            page={current}
            pageSize={grid.pageSize}
            total={filtered.length}
            onPageChange={setPage}
            note={`${grid.pageSize} per halaman (${grid.cols} × ${GRID_ROWS})`}
          />
        </>
      )}
    </Card>
  );

  const panel = managingCategories ? (
    <ServiceCategoryPanel
      categories={categories}
      usage={usage}
      adding={createCategory.isPending}
      onAdd={handleAddCategory}
      onDone={() => {
        setManagingCategories(false);
        closePanel();
      }}
    />
  ) : (
    <ServiceFormPanel
      key={`${selected?.id ?? 'new'}-${formKey}-${categories.length > 0}`}
      service={selected}
      categories={categories}
      saving={createService.isPending || updateService.isPending}
      onSave={handleSave}
      onDelete={setToDelete}
      onCancel={() => {
        setFormKey((k) => k + 1);
        select(null);
        closePanel();
      }}
    />
  );

  return (
    <>
      <PageHeader
        stats={[
          { id: 'total', label: 'Jasa', value: services.length },
          { id: 'cats', label: 'Kategori', value: categories.length },
          { id: 'avg', label: 'Tarif rata-rata', value: rp(average) },
        ]}
        actions={
          <>
            <Button
              variant="glass"
              aria-pressed={managingCategories}
              onClick={() => {
                setManagingCategories((v) => !v);
                openPanel();
              }}
            >
              <Tags aria-hidden />
              Kelola kategori
            </Button>
            <Button
              variant="glass"
              onClick={() => void exportServicesToExcel(filtered)}
              disabled={filtered.length === 0}
            >
              <Download aria-hidden />
              Ekspor Excel
            </Button>
            <Button variant="light" onClick={startNew}>
              <Plus aria-hidden />
              Tambah jasa
            </Button>
          </>
        }
      />

      <ListWithPanel list={list} panel={panel} panelOpen={panelOpen} onPanelClose={closePanel} />

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus jasa?"
        message={`${toDelete?.name ?? 'Jasa ini'} akan dihapus dari daftar. Riwayat transaksi tetap tersimpan.`}
        confirmLabel="Ya, hapus"
        tone="danger"
        busy={deleteService.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
};

export default ServiceManagement;
