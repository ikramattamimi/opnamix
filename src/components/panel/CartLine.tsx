import React from 'react';
import { Trash2 } from 'lucide-react';
import { QuantityStepper } from '@/components/form/QuantityStepper';
import { Button } from '@/components/ui/button';

// Satu baris keranjang POS: nama + keterangan, jumlah uang di kanan, lalu
// baris kendali (stepper jumlah + hapus) dan isian tambahan (batch, kedaluwarsa).
// Dipakai di POS Stok Keluar dan POS Stok Masuk; susun beberapa di CartLines.

export interface CartLineProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  amount?: React.ReactNode;
  /** Tanpa ini baris tidak punya stepper (mis. jasa) */
  quantity?: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
  };
  /** Nama item untuk label tombol dan pembaca layar */
  label: string;
  onRemove?: () => void;
  /** Isian tambahan di bawah baris kendali */
  children?: React.ReactNode;
}

export const CartLine: React.FC<CartLineProps> = ({
  title,
  subtitle,
  amount,
  quantity,
  label,
  onRemove,
  children,
}) => {
  const remove = onRemove && (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onRemove}
      aria-label={`Hapus ${label}`}
      className="shrink-0"
    >
      <Trash2 aria-hidden />
    </Button>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 gap-y-1.5 py-2.5">
      <div className="min-w-0 text-label font-semibold leading-snug">
        {title}
        {subtitle && (
          <small className="mt-0.5 block text-xs font-normal text-muted-foreground">
            {subtitle}
          </small>
        )}
      </div>
      <div className="flex items-start gap-1 text-right text-label font-semibold tabular-nums">
        {amount}
        {!quantity && remove}
      </div>
      {quantity && (
        <div className="col-span-2 flex items-center justify-between gap-2">
          <QuantityStepper
            value={quantity.value}
            onChange={quantity.onChange}
            min={quantity.min ?? 0}
            max={quantity.max}
            label={label}
          />
          {remove}
        </div>
      )}
      {children && <div className="col-span-2 min-w-0">{children}</div>}
    </div>
  );
};

// Daftar baris keranjang dengan garis pemisah
export const CartLines: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col divide-y">{children}</div>
);
