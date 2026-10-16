import React, { useState } from 'react';
import { StockInReceipt, Product } from '../types';
import { api } from '../lib/api';
import { exportStockInToExcel } from '../lib/exportUtils';
import { useStockInReceipts, useCreateStockIn } from '../hooks/useStockIn';
import StatCard from './StatCard';
import StockInForm from './StockInForm';
import StockInDetail from './StockInDetail';
import PaginationControls from './PaginationControls';
import { Button } from './ui/button';
import { DataTable } from './ui/data-table';
import { createStockInColumns } from './StockInColumns';
import { useToast } from './ui/toast';
import { withErrorDetail } from '../lib/utils';

interface StockInManagementProps {
  products?: Product[]; // Optional now, or removed
}

const StockInManagement: React.FC<StockInManagementProps> = () => {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const perPage = 10;

  const {
    data: paginatedData,
    isLoading,
    isPlaceholderData,
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
      const transactionNumber = await api.generateTransactionNumber('masuk');

      // Upload image if provided
      let imageUrl: string | undefined;
      if (file) {
        try {
          imageUrl = await api.uploadReceiptImage(file, transactionNumber);
        } catch (uploadError: any) {
          console.error('Error uploading image:', uploadError);
          showToast(
            `Gagal mengupload gambar: ${uploadError.message || JSON.stringify(uploadError)}`,
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
      <div className="space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            label="Total Stok Masuk"
            value={totalReceipts}
            icon="inventory_2"
            color="primary"
          />
          <StatCard label="Masuk Hari Ini" value="-" icon="arrow_circle_down" color="blue-500" />
          <StatCard label="Growth Stok" value="-" icon="trending_up" color="green-500" />
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-[20px] p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-text-primary-light dark:text-white">
              Daftar Penerimaan Stok
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsFormOpen(true)}
                className="shadow-lg shadow-primary/30 flex items-center gap-2"
              >
                <span className="material-icons-round text-lg">add</span>
                Terima Stok Baru
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => void exportStockInToExcel(receipts)}
              >
                <span className="material-icons-round text-sm">file_download</span> Ekspor
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <DataTable
              columns={createStockInColumns({ onView: setSelectedReceipt })}
              data={receipts}
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
