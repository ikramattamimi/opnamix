import React from 'react';
import { Eye, ReceiptText } from 'lucide-react';
import { StockInReceipt } from './types';
import { EmptyState } from '@/components/common/QueryState';
import { PageHeader } from '@/components/layout/PageHeader';

interface StockInDetailProps {
  receipt: StockInReceipt;
  onBack: () => void;
}

const StockInDetail: React.FC<StockInDetailProps> = ({ receipt, onBack }) => {
  return (
    <div className="space-y-6">
      <PageHeader title="Detail Penerimaan Stok" back={onBack} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card-light dark:bg-card-dark rounded-[20px] p-6 shadow-soft">
            <h3 className="text-lg font-bold text-text-primary-light dark:text-white mb-4">
              Informasi Transaksi
            </h3>
            <div className="space-y-4">
              <InfoRow label="No. Invoice" value={receipt.invoiceNumber} />
              <InfoRow label="Supplier" value={receipt.supplierName} />
              <InfoRow
                label="Tanggal"
                value={new Date(receipt.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
              />
              <InfoRow label="Status" value={receipt.status} isStatus />
              <InfoRow label="Penerima" value={receipt.receivedBy} />
            </div>
          </div>

          <div className="bg-primary text-white rounded-3xl p-6 shadow-xl shadow-primary/30 relative overflow-hidden h-[200px] flex flex-col justify-center">
            <div className="relative z-10">
              <span className="text-sm font-medium opacity-80 uppercase tracking-widest">
                Total Item Diterima
              </span>
              <h4 className="text-5xl font-bold mt-2">
                {receipt.items.reduce((acc, cur) => acc + cur.quantity, 0)}
              </h4>
              <p className="text-sm mt-1 opacity-70">
                Tersebar dalam {receipt.items.length} jenis produk
              </p>
            </div>
            <div className="absolute -right-4 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          {receipt.evidenceUrl ? (
            <div className="bg-card-light dark:bg-card-dark rounded-[20px] p-6 shadow-soft">
              <h3 className="text-lg font-bold text-text-primary-light dark:text-white mb-4">
                Bukti Nota
              </h3>
              <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 group relative">
                <img
                  src={receipt.evidenceUrl}
                  alt="Bukti Nota"
                  className="w-full h-auto object-contain hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    console.error('Failed to load image:', receipt.evidenceUrl);
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" dy="150" dx="50"%3EGambar tidak tersedia%3C/text%3E%3C/svg%3E';
                  }}
                />
                <a
                  href={receipt.evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2"
                >
                  <Eye className="size-6" aria-hidden />
                  Lihat Full
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-card-light dark:bg-card-dark rounded-[20px] p-6 shadow-soft">
              <h3 className="text-lg font-bold text-text-primary-light dark:text-white mb-4">
                Bukti Nota
              </h3>
              <EmptyState
                icon={ReceiptText}
                title="Tidak ada bukti nota yang diunggah"
                className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/5 p-8"
              />
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card-light dark:bg-card-dark rounded-[20px] p-6 shadow-soft h-full">
            <h3 className="text-lg font-bold text-text-primary-light dark:text-white mb-6">
              Daftar Barang
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-text-secondary-light font-bold border-b border-gray-100 dark:border-gray-800">
                    <th className="pb-4 pl-2">Produk</th>
                    <th className="pb-4">Kategori</th>
                    <th className="pb-4">Kadaluarsa</th>
                    <th className="pb-4 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {receipt.items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 pl-2">
                        <p className="font-bold text-text-primary-light dark:text-white">
                          {item.productName}
                        </p>
                        <p className="text-xs text-text-secondary-light">ID: {item.productId}</p>
                      </td>
                      <td className="py-4 text-text-secondary-light">{item.category}</td>
                      <td className="py-4 text-text-primary-light dark:text-white font-medium">
                        {new Date(item.expiryDate).toLocaleDateString('id-ID', {
                          dateStyle: 'medium',
                        })}
                      </td>
                      <td className="py-4 text-right">
                        <span className="font-bold text-primary">{item.quantity}</span> {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; isStatus?: boolean }> = ({
  label,
  value,
  isStatus,
}) => (
  <div>
    <p className="text-xs text-text-secondary-light font-medium uppercase tracking-wider">
      {label}
    </p>
    {isStatus ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-1 rounded-full text-xs font-bold bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        {value}
      </span>
    ) : (
      <p className="text-base font-bold text-text-primary-light dark:text-white mt-0.5">{value}</p>
    )}
  </div>
);

export default StockInDetail;
