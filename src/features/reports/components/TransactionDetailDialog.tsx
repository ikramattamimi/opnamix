import React from 'react';
import { toDate } from '@/lib/utils';
import type { TransactionReportRow } from '../api';

interface TransactionDetailDialogProps {
  transaction: TransactionReportRow;
  onClose: () => void;
}

const TransactionDetailDialog: React.FC<TransactionDetailDialogProps> = ({
  transaction,
  onClose,
}) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white dark:bg-card-dark w-full max-w-4xl rounded-[32px] shadow-soft p-8 overflow-y-auto max-h-[90vh] relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-text-primary-light dark:text-white">
            Detail Transaksi
          </h3>
          <p className="text-sm text-text-secondary-light">{transaction.id}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 bg-background-light dark:bg-white/5 rounded-full hover:bg-gray-200 transition-colors"
        >
          <span className="material-icons-round">close</span>
        </button>
      </div>

      <div
        className={`grid grid-cols-1 ${transaction.type === 'keluar' ? 'md:grid-cols-3 xl:grid-cols-6' : 'md:grid-cols-3 xl:grid-cols-5'} gap-4 mb-6`}
      >
        <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
          <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">Tanggal</p>
          <p className="font-bold text-text-primary-light dark:text-white">
            {toDate(transaction.date).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
          <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">Tipe</p>
          <p className="font-bold text-text-primary-light dark:text-white">
            {transaction.type === 'masuk' ? 'Masuk' : 'Keluar'}
          </p>
        </div>
        <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
          <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">Sumber</p>
          <p className="font-bold text-text-primary-light dark:text-white">
            {transaction.source === 'PEMBELIAN'
              ? 'Pembelian'
              : transaction.source === 'KASIR_LANGSUNG'
                ? 'Kasir Langsung'
                : transaction.source === 'PENGAJUAN_NAKES'
                  ? 'Pengajuan Nakes'
                  : transaction.source || '-'}
          </p>
        </div>
        <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
          <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">Status</p>
          <p className="font-bold text-text-primary-light dark:text-white">
            {transaction.status || '-'}
          </p>
        </div>
        <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
          <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">
            {transaction.type === 'masuk' ? 'Nama Supplier' : 'Nama Pasien'}
          </p>
          <p className="font-bold text-text-primary-light dark:text-white">
            {transaction.patient || '-'}
          </p>
        </div>
        {transaction.type === 'keluar' && (
          <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
            <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">
              Tanggal Lahir Pasien
            </p>
            <p className="font-bold text-text-primary-light dark:text-white">
              {transaction.birthDate
                ? new Date(transaction.birthDate).toLocaleDateString('id-ID')
                : '-'}
            </p>
          </div>
        )}
        <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
          <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">Nakes</p>
          <p className="font-bold text-text-primary-light dark:text-white">
            {transaction.nakes || '-'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-lg text-text-primary-light dark:text-white mb-3">
            Detail Obat
          </h4>
          <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-white/5 text-text-secondary-light font-bold border-b border-gray-100 dark:border-gray-800 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Nama Obat</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Harga</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transaction.drugDetails?.length > 0 ? (
                  transaction.drugDetails.map((drug) => (
                    <tr key={drug.id}>
                      <td className="px-4 py-3 font-medium text-text-primary-light dark:text-white">
                        {drug.name}
                      </td>
                      <td className="px-4 py-3 text-center">{drug.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        Rp {Number(drug.price || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-text-primary-light dark:text-white">
                        Rp {Number(drug.subtotal || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-text-secondary-light">
                      Tidak ada detail obat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg text-text-primary-light dark:text-white mb-3">
            Detail Jasa
          </h4>
          <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-white/5 text-text-secondary-light font-bold border-b border-gray-100 dark:border-gray-800 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Nama Jasa</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Harga</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transaction.serviceDetails?.length > 0 ? (
                  transaction.serviceDetails.map((service) => (
                    <tr key={service.id}>
                      <td className="px-4 py-3 font-medium text-text-primary-light dark:text-white">
                        {service.name}
                      </td>
                      <td className="px-4 py-3 text-center">{service.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        Rp {Number(service.price || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-text-primary-light dark:text-white">
                        Rp {Number(service.subtotal || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-text-secondary-light">
                      Tidak ada detail jasa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="rounded-2xl bg-primary/10 px-5 py-4 min-w-[280px] space-y-2">
            {Number(transaction.serviceFee || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary-light">Biaya Layanan</span>
                <span className="font-bold text-text-primary-light dark:text-white">
                  Rp {Number(transaction.serviceFee || 0).toLocaleString('id-ID')}
                </span>
              </div>
            )}
            {Number(transaction.discount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary-light">Diskon</span>
                <span className="font-bold text-red-500">
                  - Rp {Number(transaction.discount || 0).toLocaleString('id-ID')}
                </span>
              </div>
            )}
            <div>
              <p className="text-xs uppercase font-bold text-text-secondary-light mb-1">
                Grand Total
              </p>
              <p className="text-2xl font-bold text-primary">
                Rp {Number(transaction.total || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default TransactionDetailDialog;
