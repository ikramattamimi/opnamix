// Selisih opname: stok fisik dikurangi stok sistem. Stok fisik yang belum diisi dihitung 0.
export const calculateOpnameDifference = (physicalStock: number | undefined, systemStock: number): number =>
  (physicalStock || 0) - systemStock;
