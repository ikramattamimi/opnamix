import React from 'react';
import { useToast } from '@/components/ui/toast';
import { withErrorDetail } from '@/lib/utils';
import { calculateRequestTotals } from '../stockOutTotals';
import { StockOutRequest } from '../types';
import { useProcessStockOutRequest } from '../useStockOut';

// Permintaan yang akan diproses beserta diskon dan biaya layanan dari mode proses
export interface ProcessDraft {
  request: StockOutRequest;
  discount: number;
  serviceFee: number;
}

interface StockOutProcessDialogProps {
  draft: ProcessDraft;
  onClose: () => void;
}

const DASHED_DIVIDER = 'mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-white/10';

// Konfirmasi sebelum permintaan diproses dan stok dikurangi
const StockOutProcessDialog: React.FC<StockOutProcessDialogProps> = ({ draft, onClose }) => {
  const { showToast } = useToast();
  const processTransaction = useProcessStockOutRequest();
  const { request, discount, serviceFee } = draft;
  const finalTotal = calculateRequestTotals(request, { discount, serviceFee }).grandTotal;

  const processRequest = async () => {
    if (processTransaction.isPending) return;

    try {
      await processTransaction.mutateAsync({
        number: request.id,
        status: 'selesai',
        diskon: discount,
        serviceFee,
        total: finalTotal,
      });
      showToast('Permintaan berhasil diproses. Stok telah dikurangi secara otomatis.', 'success');
      onClose();
    } catch (error) {
      console.error('Error processing request:', error);
      showToast(withErrorDetail('Gagal memproses permintaan', error), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-3xl shadow-2xl p-6 animate-scaleUp text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <span className="material-icons-round text-4xl">inventory</span>
        </div>
        <h3 className="text-2xl font-bold text-text-primary-light dark:text-white mb-2">
          Proses Permintaan?
        </h3>
        <p className="text-text-secondary-light mb-6">
          Anda akan memproses permintaan untuk pasien{' '}
          <span className="font-bold text-primary">{request.patient.fullName}</span>. Jika ada item
          obat, stok akan dikurangi secara otomatis sesuai item yang diminta.
        </p>

        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-6 text-left border border-gray-100 dark:border-white/10 max-h-40 overflow-y-auto">
          <p className="text-xs font-bold text-text-secondary-light uppercase mb-2">
            Ringkasan Item:
          </p>
          <ul className="space-y-2">
            {request.drugs.length > 0 ? (
              request.drugs.map((d, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-text-primary-light dark:text-white">{d.productName}</span>
                  <span className="font-bold">x{d.quantity}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Tidak ada item obat. Permintaan ini hanya berisi jasa.
              </li>
            )}
          </ul>
          {request.services.length > 0 && (
            <>
              <p className="text-xs font-bold text-text-secondary-light uppercase mb-2 mt-4">
                Ringkasan Jasa:
              </p>
              <ul className="space-y-2">
                {request.services.map((service, i) => (
                  <li key={`svc-${i}`} className="flex justify-between text-sm">
                    <span className="text-text-primary-light dark:text-white">{service.name}</span>
                    <span className="font-bold">Rp {service.price.toLocaleString('id-ID')}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {serviceFee > 0 && (
            <div className={`${DASHED_DIVIDER} flex justify-between text-sm`}>
              <span className="text-text-secondary-light">Biaya Layanan</span>
              <span className="font-bold text-text-primary-light dark:text-white">
                Rp {serviceFee.toLocaleString('id-ID')}
              </span>
            </div>
          )}
          {discount > 0 && (
            <div
              className={`${serviceFee > 0 ? 'mt-2' : DASHED_DIVIDER} flex justify-between text-sm`}
            >
              <span className="text-text-secondary-light">Diskon Diberikan</span>
              <span className="font-bold text-red-500">
                - Rp {discount.toLocaleString('id-ID')}
              </span>
            </div>
          )}
          <div
            className={`flex justify-between text-sm ${discount === 0 && serviceFee === 0 ? DASHED_DIVIDER : 'mt-2'}`}
          >
            <span className="text-text-primary-light dark:text-white font-bold">Total Tagihan</span>
            <span className="font-bold text-primary dark:text-blue-300">
              Rp {finalTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-text-secondary-light font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={processRequest}
            disabled={processTransaction.isPending}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {processTransaction.isPending ? (
              <>
                <span className="material-icons-round text-lg animate-spin">refresh</span>
                Memproses...
              </>
            ) : (
              <>
                <span className="material-icons-round text-lg">check_circle</span>
                Ya, Proses
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockOutProcessDialog;
