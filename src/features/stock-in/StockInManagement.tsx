import React, { useState } from 'react';
import { StockInReceipt } from './types';
import { Product } from '@/features/products/types';
import { transactionsApi } from '@/features/transactions/api';
import { stockInApi } from './api';
import { exportStockInToExcel } from '@/features/reports/exportUtils';
import { useStockInReceipts, useCreateStockIn } from './useStockIn';
import StatCard from '@/components/common/StatCard';
import { Archive, CircleArrowDown, Download, Plus, TrendingUp } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import StockInForm from './StockInForm';
import StockInDetail from './StockInDetail';
import PaginationControls from '@/components/common/PaginationControls';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { createStockInColumns } from './StockInColumns';
import { useToast } from '@/components/ui/toast';
import { withErrorDetail, getErrorMessage } from '@/lib/utils';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';

interface StockInManagementProps {
  products?: Product[]; // Optional now, or removed
}

const StockInManagement: React.FC<StockInManagementProps> = () => {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const perPage = 10;

  const {
    data: paginatedData,
    isPlaceholderData,
    isPending,
    isError,
    refetch,
  } = useStockInReceipts({ page, perPage });
  const receipts = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 1;
  const totalReceipts = paginatedData?.total || 0;

  const createStockIn = useCreateStockIn();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<StockInReceipt | null>(null);

  const handleSaveReceipt = async (receipt: StockInReceipt, file?: Blob) => {
    setIsSubmitting(true);
    try {
      // Keep generated number only for receipt image filename
      const transactionNumber = await transactionsApi.generateTransactionNumber('masuk');

      // Upload image if provided
      let imageUrl: string | undefined;
      if (file) {
        try {
          imageUrl = await stockInApi.uploadReceiptImage(file, transactionNumber);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          showToast(
            `Gagal mengupload gambar: ${getErrorMessage(uploadError) || JSON.stringify(uploadError)}`,
            'warning',
          );
          // Continue even if upload fails
        }
      }

      // Convert StockInReceipt to Transaction Payload
      await createStockIn.mutateAsync({
        nomor: receipt.invoiceNumber,
        tanggal: receipt.date,
        tipe: 'masuk',
        tipe_sumber: 'PEMBELIAN',
        status: 'selesai',
        nama_pasien: receipt.supplierName,
        keterangan: `Invoice: ${receipt.invoiceNumber}`,
        bukti: imageUrl,
        total: 0,
        items: receipt.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: 0,
          batch: `EXP: ${item.expiryDate}`,
          expiryDate: item.expiryDate,
        })),
        services: [],
      });

      setIsFormOpen(false);
      showToast(
        'Stok berhasil disimpan!' + (imageUrl ? ' Bukti nota berhasil diupload.' : ''),
        'success',
      );
    } catch (error) {
      console.error('Error saving stock in:', error);
      showToast(withErrorDetail('Gagal menyimpan penerimaan stok', error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedReceipt) {
    return <StockInDetail receipt={selectedReceipt} onBack={() => setSelectedReceipt(null)} />;
  }

  return (
    <>
      <PageLayout>
        <PageHeader
          title="Daftar Penerimaan Stok"
          description="Catat dan telusuri stok yang masuk dari pemasok."
          actions={
            <>
              <Button
                onClick={() => setIsFormOpen(true)}
                className="shadow-lg shadow-primary/30 flex items-center gap-2 [&_svg]:size-5"
              >
                <Plus aria-hidden />
                Terima Stok Baru
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => void exportStockInToExcel(receipts)}
              >
                <Download aria-hidden /> Ekspor
              </Button>
            </>
          }
        />

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard label="Total Stok Masuk" value={totalReceipts} icon={Archive} color="primary" />
          <StatCard label="Masuk Hari Ini" value="-" icon={CircleArrowDown} color="blue-500" />
          <StatCard label="Growth Stok" value="-" icon={TrendingUp} color="green-500" />
        </div>

        <Card className="p-6">
          <div className="overflow-x-auto">
            {isPending ? (
              <LoadingState label="Memuat penerimaan stok..." />
            ) : isError ? (
              <ErrorState onRetry={() => void refetch()} />
            ) : receipts.length === 0 ? (
              <EmptyState icon={Archive} title="Belum ada penerimaan stok." />
            ) : (
              <DataTable
                columns={createStockInColumns({ onView: setSelectedReceipt })}
                data={receipts}
                searchable={false}
              />
            )}
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              isPlaceholderData={isPlaceholderData}
            />
          </div>
        </Card>
      </PageLayout>
      {isFormOpen && (
        <StockInForm
          onSave={handleSaveReceipt}
          onClose={() => setIsFormOpen(false)}
          isLoading={isSubmitting}
        />
      )}
    </>
  );
};

export default StockInManagement;
