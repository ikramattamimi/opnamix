// Selisih opname: stok fisik dikurangi stok sistem. Stok fisik yang belum diisi dihitung 0.
export const calculateOpnameDifference = (
  physicalStock: number | null | undefined,
  systemStock: number | null,
): number => (physicalStock || 0) - (systemStock ?? 0); // null dihitung 0, sama seperti aritmetika JS
