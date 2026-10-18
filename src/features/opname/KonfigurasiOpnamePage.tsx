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
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';

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
    return (
      <>
        <PageHeader />
        <LoadingState label="Memuat data..." className="min-h-[400px]" />
      </>
    );
  }

  const listProps = {
    schedules,
    onEdit: openModal,
    onDelete: setDeleteId,
    onToggle: handleToggle,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button variant="light" onClick={() => openModal(null)}>
            <Plus aria-hidden />
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
        <Card>
          <ErrorState
            title="Gagal memuat jadwal opname"
            onRetry={() => void schedulesQuery.refetch()}
          />
        </Card>
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
    </div>
  );
};

export default KonfigurasiOpnamePage;
