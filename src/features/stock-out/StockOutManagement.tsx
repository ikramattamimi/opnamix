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
      <div className="space-y-6">
        <div className="bg-card rounded-3xl p-6 shadow-soft flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {isNakes ? 'Permintaan Obat' : 'Pusat Kendali Pengeluaran'}
              </h4>
            </div>
            <p className="text-muted-foreground text-sm max-w-xl">
              {isNakes
                ? 'Ajukan permintaan obat dan alkes untuk pasien melalui formulir di sini.'
                : 'Kelola pengeluaran stok melalui formulir permintaan medis terintegrasi atau lakukan pencatatan manual cepat.'}
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3 shrink-0">
            {canCreateRequest && (
              <Button
                onClick={() => setIsRequestFormOpen(true)}
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 text-sm transition-all w-auto [&_svg]:size-5"
              >
                <Pill aria-hidden />
                <span>Buat Permintaan</span>
              </Button>
            )}

            {canManualStock && (
              <Button
                onClick={() => setIsManualModalOpen(true)}
                variant="outline"
                className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 text-sm shadow-sm hover:shadow-md transition-all bg-card text-primary border-primary/20 hover:border-primary/50 [&_svg]:size-4 sm:[&_svg]:size-5"
              >
                <NotebookPen aria-hidden />
                <span>Stok Manual</span>
              </Button>
            )}
          </div>
        </div>

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
