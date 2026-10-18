import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { StockOutTotals } from '../stockOutTotals';

interface RequestSummaryProps {
  totals: StockOutTotals;
  // Diisi saat mode proses atau edit: biaya layanan dan diskon bisa diubah
  onServiceFeeChange?: (value: number) => void;
  onDiscountChange?: (value: number) => void;
}

const toAmount = (value: string) => (value === '' ? 0 : Math.max(0, Number(value)));

const AmountInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label: string;
  className: string;
}> = ({ value, onChange, label, className }) => (
  <Input
    type="number"
    min="0"
    aria-label={label}
    value={value === 0 ? '' : value}
    onChange={(e) => onChange(toAmount(e.target.value))}
    className={cn(
      'w-32 px-3 text-right text-sm md:text-sm border border-gray-200 dark:border-gray-700 bg-card text-foreground focus-visible:ring-primary focus:border-primary font-bold',
      className,
    )}
    placeholder="0"
  />
);

// Ringkasan biaya di detail permintaan
const RequestSummary: React.FC<RequestSummaryProps> = ({
  totals,
  onServiceFeeChange,
  onDiscountChange,
}) => (
  <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 border border-dashed border-gray-200 dark:border-white/10 space-y-3">
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>Total Harga Obat</span>
      <span className="font-bold text-foreground">
        Rp {totals.totalDrugs.toLocaleString('id-ID')}
      </span>
    </div>
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>Total Harga Jasa</span>
      <span className="font-bold text-foreground">
        Rp {totals.totalServices.toLocaleString('id-ID')}
      </span>
    </div>
    {onServiceFeeChange ? (
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Biaya Layanan</span>
        <div className="flex items-center gap-2">
          <span>Rp</span>
          <AmountInput
            value={totals.serviceFee}
            onChange={onServiceFeeChange}
            label="Biaya Layanan"
            className="text-primary"
          />
        </div>
      </div>
    ) : (
      totals.serviceFee > 0 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Biaya Layanan</span>
          <span className="font-bold text-foreground">
            Rp {totals.serviceFee.toLocaleString('id-ID')}
          </span>
        </div>
      )
    )}
    {onDiscountChange ? (
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Diskon</span>
        <div className="flex items-center gap-2">
          <span>- Rp</span>
          <AmountInput
            value={totals.discount}
            onChange={onDiscountChange}
            label="Diskon"
            className="text-red-500"
          />
        </div>
      </div>
    ) : (
      totals.discount > 0 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Diskon</span>
          <span className="font-bold text-red-500">
            - Rp {totals.discount.toLocaleString('id-ID')}
          </span>
        </div>
      )
    )}
    <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between items-center">
      <span className="font-bold text-lg text-primary dark:text-white">Total Keseluruhan</span>
      <span className="font-extrabold text-2xl text-primary dark:text-white">
        Rp {totals.grandTotal.toLocaleString('id-ID')}
      </span>
    </div>
  </div>
);

export default RequestSummary;
