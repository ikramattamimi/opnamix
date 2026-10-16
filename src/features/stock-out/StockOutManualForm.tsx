import React, { useState } from 'react';
import { Product, StockOutManual, StockOutManualItem } from '@/types';
import ProductLookupModal from '@/features/products/ProductLookupModal';
import { useProducts } from '@/features/products/useProducts';
import { Button } from '@/components/ui/button';

interface StockOutManualFormProps {
  onSave: (record: StockOutManual) => void;
  onClose: () => void;
  isLoading?: boolean;
}

interface ValidationErrors {
  formNumber?: string;
  date?: string;
  patientName?: string;
  items?: Record<string, { productId?: string; quantity?: string }>;
}

const StockOutManualForm: React.FC<StockOutManualFormProps> = ({
  onSave,
  onClose,
  isLoading = false,
}) => {
  const { data: productData } = useProducts({ page: 1, perPage: 1000 });
  const products = productData?.data || [];

  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [formNumber, setFormNumber] = useState(`OUT-${Date.now()}`);
  const [patientName, setPatientName] = useState('');
  const [patientBirthDate, setPatientBirthDate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  /* State for Inline Editing */
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  /* Initialize with one empty row */
  const [items, setItems] = useState<StockOutManualItem[]>([
    {
      id: Math.random().toString(36).substr(2, 9),
      productId: '',
      productName: '',
      quantity: 1,
      unit: '',
      instructions: '-',
    },
  ]);

  // Validation State
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    if (!formNumber.trim()) {
      newErrors.formNumber = 'Nomor formulir wajib diisi';
      isValid = false;
    }

    if (!date) {
      newErrors.date = 'Tanggal wajib diisi';
      isValid = false;
    }

    if (!patientName.trim()) {
      newErrors.patientName = 'Nama pasien wajib diisi';
      isValid = false;
    }

    const itemErrors: Record<string, { productId?: string; quantity?: string }> = {};

    items.forEach((item) => {
      const currentItemErrors: { productId?: string; quantity?: string } = {};
      let itemValid = true;

      if (!item.productId) {
        // Only flag as error if this is the ONLY item or if user tried to submit
        // For now, simple validation: if row exists, it must be valid
        currentItemErrors.productId = 'Produk wajib dipilih';
        itemValid = false;
      }

      if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
        currentItemErrors.quantity = 'Jumlah harus lebih dari 0';
        itemValid = false;
      }

      if (!itemValid) {
        itemErrors[item.id] = currentItemErrors;
        isValid = false;
      }
    });

    if (Object.keys(itemErrors).length > 0) {
      newErrors.items = itemErrors;
    }

    // Additional check: must have at least one completely valid item?
    // The current logic ensures all visible rows are valid.
    // Usually we want at least one item.
    // If items is empty (removed all), that's invalid too.
    if (items.length === 0) {
      // This case is handled by removeItem preventing last item removal, but good to be safe
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
    validateForm();
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        productId: '',
        productName: '',
        quantity: 1,
        unit: '',
        instructions: '-',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      if (prev.length > 1) {
        // Clean up errors for removed item
        const newErrors = { ...errors };
        if (newErrors.items && newErrors.items[id]) {
          delete newErrors.items[id];
          setErrors(newErrors);
        }
        return prev.filter((item) => item.id !== id);
      } else {
        // If removing last item, just reset it
        // Resetting also means clearing errors for it potentially, but simpler to just reset item content
        return [
          {
            id: Math.random().toString(36).substr(2, 9),
            productId: '',
            productName: '',
            quantity: 1,
            unit: '',
            instructions: '-',
          },
        ];
      }
    });
  };

  const handleUpdateItem = <K extends keyof StockOutManualItem>(
    id: string,
    field: K,
    value: StockOutManualItem[K] | undefined, // input angka yang dikosongkan mengirim undefined
  ) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    if (field === 'quantity') {
      // trigger validation/clear error for quantity
      // Simpler to rely on next submit or blur?
      // For numbers, inline validation feedback is nice.
    }
  };

  const handleOpenLookup = (id: string) => {
    setActiveRowId(id);
    setIsLookupOpen(true);
  };

  const handleProductSelect = (product: Product) => {
    if (activeRowId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === activeRowId
            ? {
                ...item,
                productId: product.id,
                productName: product.name,
                unit: product.unit,
              }
            : item,
        ),
      );

      setIsLookupOpen(false);
      setActiveRowId(null);

      // Clear specific error if exists
      if (errors.items && errors.items[activeRowId]?.productId) {
        // Re-validate to clear
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched = new Set<string>(['formNumber', 'date', 'patientName']);
    items.forEach((item) => {
      allTouched.add(`items.${item.id}.productId`);
      allTouched.add(`items.${item.id}.quantity`);
    });
    setTouched(allTouched);

    if (!validateForm()) return;

    // Filter out empty rows (though validation enforces valid rows now)
    const validItems = items.filter((i) => i.productId && i.quantity > 0);

    const record: StockOutManual = {
      id: Math.random().toString(36).substr(2, 9),
      requestId: formNumber,
      patient: {
        fullName: patientName,
        medicalRecordNumber: '-',
        birthDate: patientBirthDate,
        diagnosis: '-',
      },
      items: validItems,
      date: date,
      reason: reason || '-',
      tipeSumber: 'KASIR_LANGSUNG',
      services: [],
    };

    onSave(record);
  };

  const totalCost = items.reduce((sum, item) => {
    if (!item.productId) return sum;
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.sellingPrice * item.quantity : 0);
  }, 0);

  const getInputClassName = (error?: string) => {
    return error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background-light dark:bg-background-dark w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-[40px] shadow-soft p-4 md:p-8 lg:p-10 font-display">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-text-primary-light dark:text-white">
            Catat Stok Keluar Manual
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-200 dark:hover:bg-white/5"
          >
            <span className="material-icons-round">close</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informasi Dasar */}
            <div className="bg-white dark:bg-card-dark rounded-[20px] p-6 shadow-soft space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Nomor Formulir <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`w-full rounded-xl border-gray-100 dark:border-gray-700 bg-background-light dark:bg-background-dark px-4 py-3 text-sm focus:border-primary focus:ring-primary text-text-primary-light dark:text-white ${getInputClassName(touched.has('formNumber') ? errors.formNumber : undefined)}`}
                    type="text"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    onBlur={() => handleBlur('formNumber')}
                  />
                  {touched.has('formNumber') && errors.formNumber && (
                    <p className="text-xs text-red-500 ml-1">{errors.formNumber}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Tanggal Pengeluaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`w-full rounded-xl border-gray-100 dark:border-gray-700 bg-background-light dark:bg-background-dark px-4 py-3 text-sm focus:border-primary focus:ring-primary text-text-primary-light dark:text-white ${getInputClassName(touched.has('date') ? errors.date : undefined)}`}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onBlur={() => handleBlur('date')}
                  />
                  {touched.has('date') && errors.date && (
                    <p className="text-xs text-red-500 ml-1">{errors.date}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                  Nama Pasien <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full rounded-xl border-gray-100 dark:border-gray-700 bg-background-light dark:bg-background-dark px-4 py-3 text-sm focus:border-primary focus:ring-primary text-text-primary-light dark:text-white ${getInputClassName(touched.has('patientName') ? errors.patientName : undefined)}`}
                  placeholder="Masukkan nama pasien"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  onBlur={() => handleBlur('patientName')}
                />
                {touched.has('patientName') && errors.patientName && (
                  <p className="text-xs text-red-500 ml-1">{errors.patientName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Tanggal Lahir
                  </label>

                  <input
                    className="w-full rounded-xl border-gray-100 dark:border-gray-700 bg-background-light dark:bg-background-dark px-4 py-3 text-sm focus:border-primary focus:ring-primary text-text-primary-light dark:text-white"

                    type="date"

                    value={patientBirthDate}

                    onChange={(e) => setPatientBirthDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Permintaan Obat & Alkes Section - EDITABLE TABLE */}
            <div className="bg-white dark:bg-card-dark rounded-[20px] p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/20 text-secondary">
                  <span className="material-icons-round text-lg">medical_services</span>
                </span>
                <h4 className="text-base font-bold text-text-primary-light dark:text-white">
                  Permintaan Obat & Alkes
                </h4>
              </div>

              <div className="bg-white dark:bg-background-dark/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary-light dark:text-gray-400 uppercase">
                        Nama Obat <span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-text-secondary-light dark:text-gray-400 uppercase w-24">
                        Jml <span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-text-secondary-light dark:text-gray-400 uppercase w-24">
                        Satuan
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-text-secondary-light dark:text-gray-400 uppercase">
                        Harga
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-text-secondary-light dark:text-gray-400 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {items.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      const price = product ? product.sellingPrice : 0;
                      const total = price * item.quantity;

                      const itemError = errors.items?.[item.id];
                      const isProductIdTouched = touched.has(`items.${item.id}.productId`);
                      const isQuantityTouched = touched.has(`items.${item.id}.quantity`);

                      return (
                        <tr
                          key={item.id}
                          className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <div
                                onClick={() => handleOpenLookup(item.id)}
                                className={`cursor-pointer px-3 py-2 rounded-xl border border-transparent hover:border-primary/30 hover:bg-white dark:hover:bg-black/20 transition-all flex items-center justify-between ${!item.productId ? 'text-text-secondary-light italic bg-gray-50/50 dark:bg-white/5' : 'font-bold text-text-primary-light dark:text-white'} ${isProductIdTouched && itemError?.productId ? 'border-red-500 bg-red-50/50' : ''}`}
                              >
                                <span className="truncate max-w-[200px]">
                                  {item.productName || 'Pilih Obat...'}
                                </span>
                                <span className="material-icons-round text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                  search
                                </span>
                              </div>
                              {(isProductIdTouched || Object.keys(errors).length > 0) &&
                                itemError?.productId && (
                                  <span className="text-[10px] text-red-500 mt-1 ml-1">
                                    {itemError.productId}
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex flex-col items-center">
                              <input
                                type="number"
                                min="1"
                                className={`w-full bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-white/10 focus:border-primary rounded-xl text-center font-bold text-sm py-1 ${isQuantityTouched && itemError?.quantity ? 'border-red-500' : ''}`}
                                value={item.quantity ?? ''}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    item.id,
                                    'quantity',
                                    e.target.value === '' ? undefined : Number(e.target.value),
                                  )
                                }
                                onBlur={() => handleBlur(`items.${item.id}.quantity`)}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-text-secondary-light dark:text-gray-400">
                            {item.unit || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-text-secondary-light dark:text-gray-400">
                            {price > 0 ? `Rp ${price.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-text-primary-light dark:text-white">
                            {total > 0 ? `Rp ${total.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <Button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 h-8 w-8"
                              title="Hapus Baris"
                              aria-label="Hapus Baris"
                            >
                              <span className="material-icons-round text-lg">close</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  variant="ghost"
                  className="w-full h-auto py-3 text-sm font-bold text-primary hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-center gap-2 border-t border-dashed border-gray-200 dark:border-white/10 rounded-t-none"
                >
                  <span className="material-icons-round text-lg">add</span>
                  Tambah Baris Baru
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Keterangan Section */}
            <div className="bg-white dark:bg-card-dark rounded-[20px] p-6 shadow-soft space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-primary-light dark:text-white">
                  Keterangan
                </label>
                <textarea
                  className="w-full bg-background-light dark:bg-background-dark border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 text-text-primary-light dark:text-white resize-none"
                  placeholder="Ketik keterangan di sini..."
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-[20px] p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <h3 className="font-bold text-lg mb-4 relative z-10">Ringkasan Biaya</h3>

              <div className="flex flex-col gap-3 relative z-10 mb-6">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-white/90">Total Tagihan</span>
                  <span className="text-2xl font-bold">Rp {totalCost.toLocaleString('id-ID')}</span>
                </div>
                <p className="text-xs text-blue-100/80 mt-1">
                  *Total otomatis dihitung berdasarkan produk dan jumlah yang diinput.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-primary hover:bg-blue-50 font-bold py-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 relative z-10 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="material-icons-round animate-spin">refresh</span>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <span className="material-icons-round">send</span>
                    Kirim Permintaan
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {isLookupOpen && (
        <ProductLookupModal
          products={products}
          onClose={() => setIsLookupOpen(false)}
          onSelect={handleProductSelect}
          allowAddProduct={false}
        />
      )}
    </div>
  );
};

export default StockOutManualForm;
