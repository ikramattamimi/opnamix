import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDeleteOpname } from './useOpname';
import { useDraftOpnames, useOpnameHistory, useUpcomingOpnames } from './useOpnameHistory';
import { useActiveOpnameSchedules } from './useOpnameSchedules';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { LoadingState } from '@/components/common/QueryState';
import { OpnameCard, ScheduleInfo } from './components/riwayat/format';
import UpcomingOpnameList from './components/riwayat/UpcomingOpnameList';
import OpnameHistoryList from './components/riwayat/OpnameHistoryList';
import ManualOpnameDialog from './components/riwayat/ManualOpnameDialog';
import {
  ActiveSchedulesSidebar,
  ActiveSchedulesStrip,
} from './components/riwayat/ActiveSchedulesPanel';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';

const NO_CARDS: OpnameCard[] = [];
const NO_SCHEDULE_INFO: ScheduleInfo[] = [];

const RiwayatOpnamePage: React.FC = () => {
  const { showToast } = useToast();
  const upcomingQuery = useUpcomingOpnames();
  const draftsQuery = useDraftOpnames();
  const historyQuery = useOpnameHistory();
  const activeSchedulesQuery = useActiveOpnameSchedules();
  const deleteOpname = useDeleteOpname();
  const upcoming: OpnameCard[] = upcomingQuery.data ?? NO_CARDS;
  const drafts: OpnameCard[] = draftsQuery.data ?? NO_CARDS;
  const history: OpnameCard[] = historyQuery.data ?? NO_CARDS;
  // Kalau jadwal aktif gagal dimuat, panel tampil seperti belum ada jadwal
  const activeSchedules: ScheduleInfo[] = activeSchedulesQuery.data ?? NO_SCHEDULE_INFO;
  const isLoading =
    upcomingQuery.isLoading ||
    draftsQuery.isLoading ||
    historyQuery.isLoading ||
    activeSchedulesQuery.isLoading;

  const [showManualModal, setShowManualModal] = useState(false);
  // Dinaikkan setiap dialog dibuka supaya isian dialog mulai dari awal
  const [manualDialogKey, setManualDialogKey] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openManualModal = () => {
    setManualDialogKey((k) => k + 1);
    setShowManualModal(true);
  };

  const doDeleteOpname = async () => {
    const id = deleteId;
    setDeleteId(null);
    if (!id) return;
    try {
      // Daftar opname ikut ter-refresh lewat invalidasi
      await deleteOpname.mutateAsync(id);
      showToast('Opname berhasil dihapus.', 'success');
    } catch (error) {
      console.error('Failed to delete opname:', error);
      showToast('Gagal menghapus opname.', 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Memuat data..." className="min-h-[400px]" />;
  }

  return (
    <PageLayout>
      <PageHeader
        title="Riwayat Opname"
        description="Opname yang dijadwalkan, masih berupa draf, dan sudah selesai."
      />

      <div className="md:hidden">
        <ActiveSchedulesStrip schedules={activeSchedules} />
      </div>

      <div className="md:flex md:gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          <UpcomingOpnameList
            drafts={drafts}
            upcoming={upcoming}
            isError={upcomingQuery.isError || draftsQuery.isError}
            onRetry={() => {
              void upcomingQuery.refetch();
              void draftsQuery.refetch();
            }}
            onDelete={setDeleteId}
          />
          <OpnameHistoryList
            history={history}
            isError={historyQuery.isError}
            onRetry={() => void historyQuery.refetch()}
            onDelete={setDeleteId}
          />
        </div>

        {/* Kolom kanan, desktop saja */}
        <div className="hidden md:block md:w-[30%] flex-shrink-0">
          <div className="sticky top-32 space-y-4">
            <ActiveSchedulesSidebar schedules={activeSchedules} onAddOpname={openManualModal} />
          </div>
        </div>
      </div>

      {/* Tombol tambah opname melayang (mobile) */}
      <Button
        size="icon-lg"
        onClick={openManualModal}
        className="md:hidden fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-50 active:scale-95 transition-transform [&_svg]:size-6"
        title="Tambah Opname"
        aria-label="Tambah Opname"
      >
        <Plus aria-hidden />
      </Button>

      <ManualOpnameDialog
        key={manualDialogKey}
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
      />

      <ConfirmationModal
        isOpen={deleteId !== null}
        title="Hapus Opname?"
        message="Yakin ingin menghapus opname ini beserta semua detailnya? Tindakan ini tidak dapat dibatalkan."
        type="danger"
        confirmText="Ya, Hapus"
        onConfirm={doDeleteOpname}
        onCancel={() => setDeleteId(null)}
      />
    </PageLayout>
  );
};

export default RiwayatOpnamePage;
