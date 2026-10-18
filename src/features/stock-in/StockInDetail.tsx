import React from 'react';
import { ArrowLeft, Eye, ReceiptText } from 'lucide-react';
import { StockInReceipt } from './types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/QueryState';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface StockInDetailProps {
  receipt: StockInReceipt;
  onBack: () => void;
}

const StockInDetail: React.FC<StockInDetailProps> = ({ receipt, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Kembali"
          className="w-auto p-2 text-current bg-card hover:bg-white dark:hover:bg-card rounded-full shadow-soft hover:text-primary transition-colors [&_svg]:size-6"
        >
          <ArrowLeft aria-hidden />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Detail Penerimaan Stok</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Informasi Transaksi</h3>
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
          </Card>

          <div className="bg-primary text-white rounded-2xl p-6 shadow-xl shadow-primary/30 relative overflow-hidden h-[200px] flex flex-col justify-center">
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
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Bukti Nota</h3>
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
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Bukti Nota</h3>
              <EmptyState
                icon={ReceiptText}
                title="Tidak ada bukti nota yang diunggah"
                className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/5 p-8"
              />
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6 h-full">
            <h3 className="text-lg font-bold text-foreground mb-6">Daftar Barang</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs uppercase tracking-wide text-muted-foreground font-bold">
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Kadaluarsa</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-sm">
                  {receipt.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <p className="font-bold text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">ID: {item.productId}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.category}</TableCell>
                      <TableCell className="text-foreground font-medium">
                        {new Date(item.expiryDate).toLocaleDateString('id-ID', {
                          dateStyle: 'medium',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-primary">{item.quantity}</span> {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
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
    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
    {isStatus ? (
      <Badge variant="ok" className="mt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        {value}
      </Badge>
    ) : (
      <p className="text-base font-bold text-foreground mt-0.5">{value}</p>
    )}
  </div>
);

export default StockInDetail;
