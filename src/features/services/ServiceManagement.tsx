import React, { useState } from 'react';
import { Service } from './types';
import { useServices, useDeleteService } from './useServices';
import StatCard from '@/components/common/StatCard';
import { BriefcaseMedical, DollarSign } from 'lucide-react';
import PaginationControls from '@/components/common/PaginationControls';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { createServiceColumns } from './ServiceColumns';
import { useToast } from '@/components/ui/toast';
import { exportServicesToExcel } from '@/features/reports/exportUtils';
import { ServiceFormDialog } from './components/ServiceFormDialog';
import { ServiceCategoryDialog } from './components/ServiceCategoryDialog';

// Form jasa: tertutup, tambah baru, atau edit jasa tertentu
type ServiceFormState = { isOpen: false } | { isOpen: true; service?: Service };

const ServiceManagement: React.FC = () => {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data: paginatedData, isPlaceholderData } = useServices({ page, perPage });
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
      <div className="space-y-6">
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

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-white">Daftar Jasa</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="shadow-md flex items-center gap-2"
              onClick={() => setIsCategoryModalOpen(true)}
            >
              <span className="material-icons-round">playlist_add</span>
              Tambah Kategori
            </Button>
            <Button
              variant="outline"
              className="shadow-md flex items-center gap-2"
              onClick={() => void exportServicesToExcel(services)}
              disabled={services.length === 0}
            >
              <span className="material-icons-round">file_download</span>
              Ekspor Excel
            </Button>
            <Button onClick={() => handleOpenModal()} className="shadow-md flex items-center gap-2">
              <span className="material-icons-round">add</span>
              Tambah Jasa Baru
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full">
          <div className="bg-card-light dark:bg-card-dark rounded-[20px] p-6 shadow-soft h-full">
            <DataTable
              columns={createServiceColumns({
                onEdit: handleOpenModal,
                onDelete: handleDeleteClick,
              })}
              data={services}
              searchable={false}
            />
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              isPlaceholderData={isPlaceholderData}
            />
          </div>
        </div>
      </div>

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
