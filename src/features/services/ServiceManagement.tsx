import React, { useState } from 'react';
import { Service } from './types';
import { useServices, useDeleteService } from './useServices';
import StatCard from '@/components/common/StatCard';
import { BriefcaseMedical, DollarSign, Download, ListPlus, Plus } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import PaginationControls from '@/components/common/PaginationControls';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { createServiceColumns } from './ServiceColumns';
import { useToast } from '@/components/ui/toast';
import { exportServicesToExcel } from '@/features/reports/exportUtils';
import { ServiceFormDialog } from './components/ServiceFormDialog';
import { ServiceCategoryDialog } from './components/ServiceCategoryDialog';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';

// Form jasa: tertutup, tambah baru, atau edit jasa tertentu
type ServiceFormState = { isOpen: false } | { isOpen: true; service?: Service };

const ServiceManagement: React.FC = () => {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const perPage = 10;

  const {
    data: paginatedData,
    isPlaceholderData,
    isPending,
    isError,
    refetch,
  } = useServices({ page, perPage });
  const services = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 1;
  const totalServices = paginatedData?.total || 0;

  const deleteService = useDeleteService();

  const [serviceForm, setServiceForm] = useState<ServiceFormState>({ isOpen: false });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; serviceId: string | null }>(
    {
      isOpen: false,
      serviceId: null,
    },
  );

  const handleOpenModal = (service?: Service) => {
    setServiceForm({ isOpen: true, service });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, serviceId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.serviceId) {
      try {
        await deleteService.mutateAsync(deleteConfirm.serviceId);
        setDeleteConfirm({ isOpen: false, serviceId: null });
      } catch (error) {
        console.error('Error deleting service:', error);
        showToast('Gagal menghapus jasa', 'error');
      }
    }
  };

  return (
    <>
      <PageLayout>
        <PageHeader
          title="Daftar Jasa"
          description="Kelola jasa layanan dan kategorinya."
          actions={
            <>
              <Button
                variant="outline"
                className="shadow-md flex items-center gap-2 [&_svg]:size-6"
                onClick={() => setIsCategoryModalOpen(true)}
              >
                <ListPlus aria-hidden />
                Tambah Kategori
              </Button>
              <Button
                variant="outline"
                className="shadow-md flex items-center gap-2 [&_svg]:size-6"
                onClick={() => void exportServicesToExcel(services)}
                disabled={services.length === 0}
              >
                <Download aria-hidden />
                Ekspor Excel
              </Button>
              <Button
                onClick={() => handleOpenModal()}
                className="shadow-md flex items-center gap-2 [&_svg]:size-6"
              >
                <Plus aria-hidden />
                Tambah Jasa Baru
              </Button>
            </>
          }
        />

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Jasa"
            value={totalServices.toString()}
            icon={BriefcaseMedical}
            color="primary"
          />
          <StatCard
            label="Harga Rata-rata"
            value={
              services.length > 0
                ? `Rp ${Math.round(services.reduce((acc, s) => acc + (s.price || 0), 0) / services.length).toLocaleString('id-ID')}`
                : '-'
            }
            icon={DollarSign}
            color="orange-500"
          />
        </div>

        {/* Table */}
        <div className="w-full">
          <Card className="p-6 h-full">
            {isPending ? (
              <LoadingState label="Memuat jasa..." />
            ) : isError ? (
              <ErrorState onRetry={() => void refetch()} />
            ) : services.length === 0 ? (
              <EmptyState icon={BriefcaseMedical} title="Belum ada jasa." />
            ) : (
              <DataTable
                columns={createServiceColumns({
                  onEdit: handleOpenModal,
                  onDelete: handleDeleteClick,
                })}
                data={services}
                searchable={false}
              />
            )}
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              isPlaceholderData={isPlaceholderData}
            />
          </Card>
        </div>
      </PageLayout>

      {serviceForm.isOpen && (
        <ServiceFormDialog
          editingService={serviceForm.service}
          onClose={() => setServiceForm({ isOpen: false })}
        />
      )}

      {isCategoryModalOpen && (
        <ServiceCategoryDialog onClose={() => setIsCategoryModalOpen(false)} />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Hapus Jasa?"
        message="Apakah Anda yakin ingin menghapus jasa ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, serviceId: null })}
      />
    </>
  );
};

export default ServiceManagement;
