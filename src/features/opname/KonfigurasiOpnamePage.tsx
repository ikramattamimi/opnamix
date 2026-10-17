import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  useDeleteOpnameSchedule,
  useOpnameSchedules,
  useToggleOpnameSchedule,
} from './useOpnameSchedules';
import { useOpnameProducts } from './useOpnameProducts';
import { OpnameSchedule } from './types';
import { Product } from '@/features/products/types';
import { Button } from '@/components/ui/button';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { ErrorState, LoadingState } from '@/components/common/QueryState';
import { useToast } from '@/components/ui/toast';
import ScheduleFormDialog from './components/konfigurasi/ScheduleFormDialog';
import { ScheduleCards, ScheduleTable } from './components/konfigurasi/ScheduleList';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';

const NO_SCHEDULES: OpnameSchedule[] = [];
const NO_PRODUCTS: Product[] = [];

const KonfigurasiOpnamePage: React.FC = () => {
  const { showToast } = useToast();
  const schedulesQuery = useOpnameSchedules();
  const productsQuery = useOpnameProducts();
  const deleteSchedule = useDeleteOpnameSchedule();
  const toggleSchedule = useToggleOpnameSchedule();
  const schedules = schedulesQuery.data ?? NO_SCHEDULES;
  const allProducts = productsQuery.data?.data ?? NO_PRODUCTS;
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<OpnameSchedule | null>(null);
  // Dinaikkan setiap dialog dibuka supaya form mulai dari nilai jadwal yang dipilih
  const [dialogKey, setDialogKey] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openModal = (schedule: OpnameSchedule | null) => {
    setEditingSchedule(schedule);
    setDialogKey((k) => k + 1);
    setShowModal(true);
  };

  const doDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    if (!id) return;
    try {
      await deleteSchedule.mutateAsync(id);
      showToast('Jadwal berhasil dihapus.', 'success');
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      showToast('Gagal menghapus jadwal.', 'error');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean | null) => {
    try {
      await toggleSchedule.mutateAsync({ id, isActive: !currentStatus });
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  if (schedulesQuery.isLoading) {
    return <LoadingState label="Memuat data..." className="min-h-[400px]" />;
  }

  const listProps = {
    schedules,
    onEdit: openModal,
    onDelete: setDeleteId,
    onToggle: handleToggle,
  };

  return (
    <PageLayout>
      <PageHeader
        title="Konfigurasi Jadwal Opname"
        description="Kelola jadwal audit stok berkala."
        actions={
          <Button
            onClick={() => openModal(null)}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-5 shadow-lg shadow-primary/20 w-full sm:w-auto"
          >
            <Plus className="mr-1.5" aria-hidden />
            Tambah Jadwal
          </Button>
        }
      />

      <ScheduleFormDialog
        key={dialogKey}
        open={showModal}
        schedule={editingSchedule}
        products={allProducts}
        onClose={() => setShowModal(false)}
      />

      {schedulesQuery.isError ? (
        <div className="bg-card rounded-2xl shadow-soft">
          <ErrorState
            title="Gagal memuat jadwal opname"
            onRetry={() => void schedulesQuery.refetch()}
          />
        </div>
      ) : (
        <>
          <ScheduleTable {...listProps} />
          <ScheduleCards {...listProps} />
        </>
      )}

      <ConfirmationModal
        isOpen={deleteId !== null}
        title="Hapus Jadwal?"
        message="Yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
        type="danger"
        confirmText="Ya, Hapus"
        onConfirm={doDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageLayout>
  );
};

export default KonfigurasiOpnamePage;
