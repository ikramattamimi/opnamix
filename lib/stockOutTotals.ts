import { StockOutRequest } from '../types';

export interface StockOutTotals {
  totalDrugs: number;
  totalServices: number;
  serviceFee: number;
  discount: number;
  grandTotal: number;
}

type TotalsSource = Pick<StockOutRequest, 'drugs' | 'services' | 'discount' | 'serviceFee'>;

// Override diisi saat permintaan sedang diproses (diskon/biaya layanan dari form proses).
export const calculateRequestTotals = (
  req: TotalsSource,
  overrides: { discount?: number; serviceFee?: number } = {},
): StockOutTotals => {
  const totalDrugs = req.drugs.reduce(
    (sum, d) => sum + (d.price || 0) * d.quantity,
    0,
  );
  const totalServices = req.services.reduce(
    (sum, s) => sum + (s.price || 0),
    0,
  );
  const usedDiscount = overrides.discount ?? req.discount ?? 0;
  const usedServiceFee = overrides.serviceFee ?? req.serviceFee ?? 0;

  return {
    totalDrugs,
    totalServices,
    serviceFee: usedServiceFee,
    discount: usedDiscount,
    grandTotal: Math.max(0, totalDrugs + totalServices + usedServiceFee - usedDiscount),
  };
};
