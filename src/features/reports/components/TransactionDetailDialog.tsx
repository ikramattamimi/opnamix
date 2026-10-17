import React from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
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
  <Dialog open onOpenChange={(open) => !open && onClose()}>
    {/* Tombol tutup bawaan DialogContent disembunyikan; dipakai tombol di header. */}
    <DialogContent className="block w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto border-none bg-card rounded-[32px] sm:rounded-[32px] shadow-soft p-8 [&>button:last-child]:hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <DialogTitle className="text-xl font-bold leading-normal tracking-normal text-foreground">
            Detail Transaksi
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {transaction.id}
          </DialogDescription>
        </div>
        <DialogClose asChild>
          <button
            type="button"
            aria-label="Tutup"
            className="p-2 bg-background dark:bg-white/5 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="size-6" aria-hidden />
          </button>
        </DialogClose>
      </div>

      <div
        className={`grid grid-cols-1 ${transaction.type === 'keluar' ? 'md:grid-cols-3 xl:grid-cols-6' : 'md:grid-cols-3 xl:grid-cols-5'} gap-4 mb-6`}
      >
        <div className="rounded-2xl bg-background p-4">
          <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Tanggal</p>
          <p className="font-bold text-foreground">
            {toDate(transaction.date).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-2xl bg-background p-4">
          <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Tipe</p>
          <p className="font-bold text-foreground">
            {transaction.type === 'masuk' ? 'Masuk' : 'Keluar'}
          </p>
        </div>
        <div className="rounded-2xl bg-background p-4">
          <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Sumber</p>
          <p className="font-bold text-foreground">
            {transaction.source === 'PEMBELIAN'
              ? 'Pembelian'
              : transaction.source === 'KASIR_LANGSUNG'
                ? 'Kasir Langsung'
                : transaction.source === 'PENGAJUAN_NAKES'
                  ? 'Pengajuan Nakes'
                  : transaction.source || '-'}
          </p>
        </div>
        <div className="rounded-2xl bg-background p-4">
          <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Status</p>
          <p className="font-bold text-foreground">{transaction.status || '-'}</p>
        </div>
        <div className="rounded-2xl bg-background p-4">
          <p className="text-xs uppercase font-bold text-muted-foreground mb-2">
            {transaction.type === 'masuk' ? 'Nama Supplier' : 'Nama Pasien'}
          </p>
          <p className="font-bold text-foreground">{transaction.patient || '-'}</p>
        </div>
        {transaction.type === 'keluar' && (
          <div className="rounded-2xl bg-background p-4">
            <p className="text-xs uppercase font-bold text-muted-foreground mb-2">
              Tanggal Lahir Pasien
            </p>
            <p className="font-bold text-foreground">
              {transaction.birthDate
                ? new Date(transaction.birthDate).toLocaleDateString('id-ID')
                : '-'}
            </p>
          </div>
        )}
        <div className="rounded-2xl bg-background p-4">
          <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Nakes</p>
          <p className="font-bold text-foreground">{transaction.nakes || '-'}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-lg text-foreground mb-3">Detail Obat</h4>
          <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-white/5 text-muted-foreground font-bold border-b border-gray-100 dark:border-gray-800 uppercase text-xs">
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
                      <td className="px-4 py-3 font-medium text-foreground">{drug.name}</td>
                      <td className="px-4 py-3 text-center">{drug.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        Rp {Number(drug.price || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        Rp {Number(drug.subtotal || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      Tidak ada detail obat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg text-foreground mb-3">Detail Jasa</h4>
          <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-white/5 text-muted-foreground font-bold border-b border-gray-100 dark:border-gray-800 uppercase text-xs">
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
                      <td className="px-4 py-3 font-medium text-foreground">{service.name}</td>
                      <td className="px-4 py-3 text-center">{service.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        Rp {Number(service.price || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        Rp {Number(service.subtotal || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
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
                <span className="text-muted-foreground">Biaya Layanan</span>
                <span className="font-bold text-foreground">
                  Rp {Number(transaction.serviceFee || 0).toLocaleString('id-ID')}
                </span>
              </div>
            )}
            {Number(transaction.discount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Diskon</span>
                <span className="font-bold text-red-500">
                  - Rp {Number(transaction.discount || 0).toLocaleString('id-ID')}
                </span>
              </div>
            )}
            <div>
              <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Grand Total</p>
              <p className="text-2xl font-bold text-primary">
                Rp {Number(transaction.total || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default TransactionDetailDialog;
