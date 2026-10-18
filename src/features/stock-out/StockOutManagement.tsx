import React, { useEffect, useRef, useState } from 'react';
import { StockOutRequest, StockOutManual } from './types';
import { useProducts } from '@/features/products/useProducts';
import { useStockOutRequests, useStockOutRealtime, useCreateStockOutRequest } from './useStockOut';
import StockOutManualForm from './StockOutManualForm';
import StockOutRequestForm from './StockOutRequestForm';
import { NotebookPen, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { withErrorDetail } from '@/lib/utils';
import { useAuth } from '@/features/auth/useAuth';
import StockOutTable from './components/StockOutTable';
import StockOutTimeline from './components/StockOutTimeline';
import StockOutDetailDialog, { type DetailMode } from './components/StockOutDetailDialog';
import StockOutProcessDialog, { type ProcessDraft } from './components/StockOutProcessDialog';
import { PageHeader } from '@/components/layout/PageHeader';

const StockOutManagement: React.FC = () => {
  const { showToast } = useToast();
  const { data: productData } = useProducts({ page: 1, perPage: 1000 });
  const products = productData?.data || [];

  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const hasInitializedQueueFilter = useRef(false);

  // Hak akses, dipakai juga untuk parameter query
  const { userProfile } = useAuth();
  const userId = userProfile?.id;
  const userRoles = userProfile?.roles ?? (userProfile?.role ? [userProfile.role] : []);
  const isAdmin = userRoles.includes('admin');
  const isFarmasi = userRoles.includes('apoteker') || userRoles.includes('farmasi');
  const isNakes = userRoles.includes('nakes');

  const {
    data: paginatedRequests,
    isLoading: isRequestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useStockOutRequests({
    page: 1,
    perPage: 1000,
    status: filterStatus === 'Semua' ? undefined : filterStatus,
    createdBy: isNakes && userId ? userId : undefined,
    nakesName: isNakes && userProfile?.full_name ? userProfile.full_name : undefined,
  });
  const requests = paginatedRequests?.data || [];

  // Realtime subscription — refresh tabel otomatis saat ada transaksi baru
  useStockOutRealtime();

  const createTransaction = useCreateStockOutRequest();

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [selected, setSelected] = useState<{ request: StockOutRequest; mode: DetailMode } | null>(
    null,
  );
  const [processDraft, setProcessDraft] = useState<ProcessDraft | null>(null);

  const canCreateRequest = isAdmin || isNakes;
  const canManualStock = isAdmin || isFarmasi;
  const canProcessRequest = isAdmin || isFarmasi;
  const canEditRequest = (request: StockOutRequest) =>
    request.status === 'Menunggu' &&
    (isAdmin || isFarmasi || (isNakes && request.createdBy === userId));

  useEffect(() => {
    if (hasInitializedQueueFilter.current || !userProfile) return;

    setFilterStatus(isAdmin || isFarmasi ? 'Menunggu' : 'Semua');
    hasInitializedQueueFilter.current = true;
  }, [isAdmin, isFarmasi, userProfile]);

  const handleSaveManualRecord = async (record: StockOutManual) => {
    try {
      const totalAmount = record.items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        return sum + (product ? product.sellingPrice : 0) * item.quantity;
      }, 0);

      await createTransaction.mutateAsync({
        tanggal: record.date,
        tipe: 'keluar',
        tipe_sumber: 'KASIR_LANGSUNG',
        status: 'selesai',
        nama_pasien: record.patient.fullName,
        tanggal_lahir_pasien: record.patient.birthDate,
        keterangan: record.reason,
        total: totalAmount,
        items: record.items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product ? product.sellingPrice : 0,
          };
        }),
        services: [],
        requestedBy: isAdmin ? 'Admin' : 'Farmasi',
      });

      setIsManualModalOpen(false);

      const itemCount = record.items.length;
      const itemSummary =
        itemCount === 1
          ? record.items[0].productName
          : `${record.items[0].productName} dan ${itemCount - 1} item lainnya`;

      showToast(
        `Stok keluar untuk ${record.patient.fullName} berhasil dicatat: ${itemSummary}`,
        'success',
      );
    } catch (error) {
      console.error('Error saving manual record:', error);
      showToast(withErrorDetail('Gagal menyimpan transaksi manual', error), 'error');
    }
  };

  const handleSaveRequest = async (request: StockOutRequest) => {
    try {
      await createTransaction.mutateAsync({
        tanggal: request.date,
        tipe: 'keluar',
        tipe_sumber: request.tipeSumber,
        status: 'diajukan',
        nama_pasien: request.patient.fullName,
        tanggal_lahir_pasien: request.patient.birthDate,
        keterangan: `Request from Nakes - Original ID: ${request.requestId}`,
        total: request.totalAmount,
        diskon: request.discount ?? 0,
        serviceFee: request.serviceFee ?? 0,
        items: request.drugs.map((drug) => {
          const product = products.find((p) => p.id === drug.productId);
          return {
            productId: drug.productId,
            quantity: drug.quantity,
            price: product ? product.sellingPrice : 0,
          };
        }),
        services: request.services.map((svc) => ({
          serviceId: svc.id,
          price: svc.price,
        })),
        requestedBy: request.requestedBy,
      });

      setIsRequestFormOpen(false);
      showToast(
        `Pengajuan stok keluar untuk ${request.patient.fullName} berhasil disimpan.`,
        'success',
      );
    } catch (error) {
      console.error('Error saving request:', error);
      showToast(withErrorDetail('Gagal menyimpan pengajuan', error), 'error');
    }
  };

  return (
    <>
      <PageHeader
        actions={
          (canCreateRequest || canManualStock) && (
            <>
              {canManualStock && (
                <Button variant="glass" onClick={() => setIsManualModalOpen(true)}>
                  <NotebookPen aria-hidden />
                  Stok Manual
                </Button>
              )}
              {canCreateRequest && (
                <Button variant="light" onClick={() => setIsRequestFormOpen(true)}>
                  <Pill aria-hidden />
                  Buat Permintaan
                </Button>
              )}
            </>
          )
        }
      />
      <div className="space-y-6">
        <StockOutTable
          requests={requests}
          isLoading={isRequestsLoading}
          error={requestsError}
          onRetry={() => void refetchRequests()}
          isNakes={isNakes}
          canProcess={canProcessRequest}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          onView={(request) => setSelected({ request, mode: 'view' })}
          onProcess={(request) => setSelected({ request, mode: 'process' })}
        />

        <StockOutTimeline />
      </div>

      {isManualModalOpen && (
        <StockOutManualForm
          onSave={handleSaveManualRecord}
          onClose={() => setIsManualModalOpen(false)}
          isLoading={createTransaction.isPending}
        />
      )}

      {isRequestFormOpen && (
        <StockOutRequestForm
          onSave={handleSaveRequest}
          onClose={() => setIsRequestFormOpen(false)}
          isLoading={createTransaction.isPending}
        />
      )}

      {selected && (
        <StockOutDetailDialog
          key={`${selected.request.id}-${selected.mode}`}
          request={selected.request}
          mode={selected.mode}
          canEdit={canEditRequest(selected.request)}
          canProcess={canProcessRequest}
          onClose={() => setSelected(null)}
          onRequestUpdated={(request) => setSelected({ ...selected, request })}
          onConfirmProcess={(draft) => {
            setProcessDraft(draft);
            setSelected(null);
          }}
        />
      )}

      {processDraft && (
        <StockOutProcessDialog draft={processDraft} onClose={() => setProcessDraft(null)} />
      )}
    </>
  );
};

export default StockOutManagement;
