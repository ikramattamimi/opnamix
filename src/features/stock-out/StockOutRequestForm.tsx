import React, { useState } from 'react';
import { StockOutRequest, RequestedDrug } from './types';
import ProductLookupModal from '@/features/products/ProductLookupModal';
import { useProducts } from '@/features/products/useProducts';
import { useServices } from '@/features/services/useServices';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { useNakesProfiles } from './useStockOut';

interface StockOutRequestFormProps {
  onSave: (request: StockOutRequest) => void;
  onClose: () => void;
  isLoading?: boolean;
}

interface ValidationErrors {
  formNumber?: string;
  patientName?: string;
  drugs?: Record<string, { productId?: string; quantity?: string }>;
}

const isDraftDrugRow = (drug: RequestedDrug) =>
  !drug.productId &&
  !drug.productName?.trim() &&
  (drug.quantity === 1 || drug.quantity === 0 || drug.quantity === undefined);

const StockOutRequestForm: React.FC<StockOutRequestFormProps> = ({
  onSave,
  onClose,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: productData } = useProducts({ page: 1, perPage: 1000 });
  const products = productData?.data || [];

  const { data: serviceData } = useServices({ page: 1, perPage: 1000 });
  const services = serviceData?.data || [];

  const [activeLookupId, setActiveLookupId] = useState<string | null>(null);

  const [formNumber, setFormNumber] = useState(
    `#REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
  );
  const [patientName, setPatientName] = useState('');
  const [patientBirthDate, setPatientBirthDate] = useState('');
  const [nakesName, setNakesName] = useState('');
  const { data: nakesList = [] } = useNakesProfiles();

  // Pilih nakes pertama sekali saja saat daftar pertama kali tersedia
  const [hasDefaultNakes, setHasDefaultNakes] = useState(false);
  if (!hasDefaultNakes && nakesList.length > 0) {
    setHasDefaultNakes(true);
    setNakesName(nakesList[0].full_name || '');
  }

  const [requestedDrugs, setRequestedDrugs] = useState<RequestedDrug[]>([]);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [discount, setDiscount] = useState<number>(0);
  const [serviceFee, setServiceFee] = useState<number>(0);

  // Validation State
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;
    const activeDrugs = requestedDrugs.filter((drug) => !isDraftDrugRow(drug));

    if (!formNumber.trim()) {
      newErrors.formNumber = 'Nomor formulir wajib diisi';
      isValid = false;
    }

    if (!patientName.trim()) {
      newErrors.patientName = 'Nama pasien wajib diisi';
      isValid = false;
    }

    // Validasi obat hanya jika ada baris obat yang ditambahkan
    const drugErrors: Record<string, { productId?: string; quantity?: string }> = {};

    activeDrugs.forEach((drug) => {
      const currentDrugErrors: { productId?: string; quantity?: string } = {};
      let drugValid = true;

      if (!drug.productId) {
        currentDrugErrors.productId = 'Produk wajib dipilih';
        drugValid = false;
      }

      if (drug.quantity <= 0) {
        currentDrugErrors.quantity = 'Jumlah harus lebih dari 0';
        drugValid = false;
      }

      if (!drugValid) {
        drugErrors[drug.id] = currentDrugErrors;
        isValid = false;
      }
    });

    if (Object.keys(drugErrors).length > 0) {
      newErrors.drugs = drugErrors;
    }

    // Minimal harus ada 1 obat (valid) ATAU 1 jasa dipilih
    const hasValidDrug =
      activeDrugs.length > 0 && activeDrugs.every((d) => d.productId && d.quantity > 0);
    const hasService = selectedServices.length > 0;
    if (!hasValidDrug && !hasService && Object.keys(drugErrors).length === 0) {
      // Tidak ada obat dan tidak ada jasa — tampilkan error umum (tidak ada field khusus)
      newErrors.drugs = { _general: { productId: 'Tambahkan minimal 1 obat atau pilih 1 jasa' } };
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
    validateForm();
  };

  const addDrug = () => {
    setRequestedDrugs([
      ...requestedDrugs,
      {
        id: Math.random().toString(),
        productId: '',
        productName: '',
        quantity: 1,
        unit: 'Tablet',
        instructions: '3x1 Sesudah makan',
      },
    ]);
  };

  const removeDrug = (id: string) => {
    setRequestedDrugs(requestedDrugs.filter((d) => d.id !== id));
    setTouched((prev) => {
      const next = new Set(prev);
      next.delete(`drugs.${id}.productId`);
      next.delete(`drugs.${id}.quantity`);
      return next;
    });

    // Clean up errors
    const newErrors = { ...errors };
    if (newErrors.drugs && newErrors.drugs[id]) {
      delete newErrors.drugs[id];
      setErrors(newErrors);
    }
  };

  const handleDrugChange = <K extends keyof RequestedDrug>(
    id: string,
    field: K,
    value: RequestedDrug[K] | undefined, // input angka yang dikosongkan mengirim undefined
  ) => {
    setRequestedDrugs(
      requestedDrugs.map((d) => {
        if (d.id === id) {
          if (field === 'productId') {
            const product = products.find((p) => p.id === value);
            return {
              ...d,
              productId: value as string,
              productName: product?.name || '',
              unit: product?.unit || 'Tablet',
            };
          }
          return { ...d, [field]: value };
        }
        return d;
      }),
    );
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  // Group services by category
  const servicesByCategory = services.reduce<Record<string, typeof services>>((acc, svc) => {
    const cat = svc.categoryName || 'Lainnya';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  const totalDrugs = requestedDrugs.reduce((sum, drug) => {
    const product = products.find((p) => p.id === drug.productId);
    return sum + (product ? product.sellingPrice * drug.quantity : 0);
  }, 0);

  const totalServices = selectedServices.reduce((sum, id) => {
    const service = services.find((s) => s.id === id);
    return sum + (service ? service.price : 0);
  }, 0);

  const totalAmount = Math.max(0, totalDrugs + totalServices + serviceFee - discount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Touch fields
    const allTouched = new Set<string>(['formNumber', 'patientName']);
    requestedDrugs.forEach((d) => {
      allTouched.add(`drugs.${d.id}.productId`);
      allTouched.add(`drugs.${d.id}.quantity`);
    });
    setTouched(allTouched);

    if (!validateForm()) return;

    const sanitizedDrugs = requestedDrugs.filter((drug) => !isDraftDrugRow(drug));

    const request: StockOutRequest = {
      id: Math.random().toString(36).substr(2, 9),
      requestId: formNumber,
      patient: {
        fullName: patientName,
        medicalRecordNumber: '-',
        birthDate: patientBirthDate,
        diagnosis: '-',
      },
      drugs: sanitizedDrugs,
      services: selectedServices.map((id) => {
        const s = services.find((svc) => svc.id === id);
        return {
          id: id,
          name: s?.name || 'Unknown',
          price: s?.price || 0,
        };
      }),
      totalAmount: Math.max(0, totalAmount),
      discount: discount,
      serviceFee: serviceFee,
      requestedBy: nakesName,
      requestedByAvatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBqgtWx9e1jooHDwfz33Jdt6bQ2j0HZ4SzvqJ1_axDjTlPbR-tFS58Fod4YQWEWXDCxd9TiTIB1S-bFtU89ptBoAi66Y1P4Df3e4uyUFX0rwZRmusSvpv2_u88tZQiqUWrg2nPdWUuciqKl8oGtia-pDjOTURi6Y1xSvjun4MEl2V5a4roBQ3fa7MXYUJibAxL_7x7QhjdO800MfK4tvvWLW_L4bxKginroIPYTP4Zy2VeA4jJ8LPJW4Ec5qt3yC5Kc3C2HmiVTxeA',
      status: 'Menunggu',
      date: new Date().toISOString().split('T')[0],
      tipeSumber: 'PENGAJUAN_NAKES',
      createdBy: userId || '',
    };
    onSave(request);
  };

  const getInputClassName = (error?: string) => {
    return error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  };

  const renderCategoryRow = (categoryName: string, categoryServices: typeof services) => {
    const isExpanded = expandedCategories.has(categoryName);
    const selectedCount = categoryServices.filter((s) => selectedServices.includes(s.id)).length;
    return (
      <div
        key={categoryName}
        className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden"
      >
        <button
          type="button"
          onClick={() => toggleCategory(categoryName)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-base text-purple-500">folder</span>
            <span className="font-bold text-sm text-brand-dark dark:text-white">
              {categoryName}
            </span>
            {selectedCount > 0 && (
              <span className="text-[10px] font-bold bg-primary text-white rounded-full px-1.5 py-0.5">
                {selectedCount}
              </span>
            )}
          </div>
          <span
            className={`material-icons-round text-base text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            expand_more
          </span>
        </button>
        {isExpanded && (
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
            {categoryServices.map((service) => (
              <div
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors ${selectedServices.includes(service.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
              >
                <input
                  checked={selectedServices.includes(service.id)}
                  onChange={() => {}}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  type="checkbox"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-brand-dark dark:text-white truncate">
                    {service.name}
                  </p>
                </div>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-300 whitespace-nowrap">
                  Rp {service.price.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background-light dark:bg-background-dark w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-[40px] shadow-soft p-4 md:p-8 lg:p-10 font-display">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-brand-dark dark:text-white tracking-tight">
            Formulir Permintaan Obat
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-200 dark:hover:bg-white/5 shadow-sm"
          >
            <span className="material-icons-round">close</span>
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Data Pasien Section */}
            <div className="bg-white dark:bg-card-dark rounded-[20px] p-6 shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-brand-dark dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                    <span className="material-icons-round text-lg">person</span>
                  </span>
                  Data Pasien
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                    Nomor Formulir <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`w-full rounded-xl border-gray-100 dark:border-gray-700 bg-background-light dark:bg-background-dark px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:text-white ${getInputClassName(touched.has('formNumber') ? errors.formNumber : undefined)}`}
                    type="text"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    onBlur={() => handleBlur('formNumber')}
                  />
                  {touched.has('formNumber') && errors.formNumber && (
                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.formNumber}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                    Nama Lengkap Pasien <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`w-full rounded-xl border-gray-100 dark:border-gray-700 bg-background-light dark:bg-background-dark px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:text-white ${getInputClassName(touched.has('patientName') ? errors.patientName : undefined)}`}
                    placeholder="Masukkan nama pasien"
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    onBlur={() => handleBlur('patientName')}
                  />
                  {touched.has('patientName') && errors.patientName && (
                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.patientName}</p>
                  )}
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                    Tanggal Lahir
                  </label>
                  <input
                    className="w-full rounded-xl border-gray-100 dark:border-gray-700 bg-background-light dark:bg-background-dark px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:text-white"
                    type="date"
                    value={patientBirthDate}
                    onChange={(e) => setPatientBirthDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Nakes Section */}
            <div className="bg-white dark:bg-card-dark rounded-[20px] p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-brand-dark dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                    <span className="material-icons-round text-lg">badge</span>
                  </span>
                  Nama Nakes
                </h3>
              </div>
              <select
                className="w-full rounded-xl border-gray-100 dark:border-gray-700 bg-background-light dark:bg-background-dark px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:text-white"
                value={nakesName}
                onChange={(e) => setNakesName(e.target.value)}
              >
                {nakesList.length === 0 && <option value="">Memuat data nakes...</option>}
                {nakesList.map((n) => (
                  <option key={n.id} value={n.full_name || ''}>
                    {n.full_name || n.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Permintaan Obat Section */}
            <div className="bg-white dark:bg-card-dark rounded-[20px] p-6 shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-brand-dark dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600">
                    <span className="material-icons-round text-lg">medication</span>
                  </span>
                  Permintaan Obat & Alkes
                  <span className="text-xs font-normal text-text-secondary-light ml-1">
                    (Opsional)
                  </span>
                </h3>
              </div>

              {requestedDrugs.length === 0 ? (
                <>
                  {errors.drugs?.['_general'] && (
                    <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                      <span className="material-icons-round text-sm">error_outline</span>
                      {errors.drugs['_general'].productId}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={addDrug}
                    className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-all group"
                  >
                    <span className="material-icons-round text-3xl group-hover:scale-110 transition-transform">
                      add_circle_outline
                    </span>
                    <span className="font-bold text-sm">Tambah Obat / Alkes</span>
                    <span className="text-xs text-slate-500">Lewati jika hanya ada jasa</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden mb-5">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-medium border-b border-gray-100 dark:border-gray-700">
                        <tr>
                          <th className="px-5 py-3">
                            Nama Obat <span className="text-red-500">*</span>
                          </th>
                          <th className="px-5 py-3 w-24 text-center">
                            Jumlah <span className="text-red-500">*</span>
                          </th>
                          <th className="px-5 py-3">Satuan</th>
                          <th className="px-5 py-3 text-right">Harga</th>
                          <th className="px-5 py-3 text-right">Total Harga</th>
                          <th className="px-5 py-3 w-16 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-card-dark">
                        {requestedDrugs.map((drug) => {
                          const product = products.find((p) => p.id === drug.productId);
                          const price = product ? product.sellingPrice : 0;
                          const total = price * drug.quantity;

                          const drugError = errors.drugs?.[drug.id];
                          const isProducerIdTouched = touched.has(`drugs.${drug.id}.productId`);
                          const isQuantityTouched = touched.has(`drugs.${drug.id}.quantity`);

                          return (
                            <tr key={drug.id}>
                              <td className="px-5 py-3">
                                <div
                                  className={`relative cursor-pointer group ${isProducerIdTouched && drugError?.productId ? 'border border-red-50 rounded-lg p-1' : ''}`}
                                  onClick={() => setActiveLookupId(drug.id)}
                                >
                                  <input
                                    className="w-full bg-transparent border-none font-bold text-brand-dark dark:text-white focus:ring-0 p-0 cursor-pointer placeholder-gray-400"
                                    value={drug.productName || ''}
                                    placeholder="Pilih Obat..."
                                    readOnly
                                  />
                                  <span className="material-icons-round text-sm text-slate-400 absolute right-0 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    edit
                                  </span>
                                </div>
                                {(isProducerIdTouched || Object.keys(errors).length > 0) &&
                                  drugError?.productId && (
                                    <p className="text-[10px] text-red-500 mt-0.5">
                                      {drugError.productId}
                                    </p>
                                  )}
                                <p className="text-[10px] text-slate-500 mt-1">
                                  Stok: {products.find((p) => p.id === drug.productId)?.stock || 0}{' '}
                                  {drug.unit}
                                </p>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <input
                                  className={`w-16 rounded-lg border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark text-sm py-1 px-2 focus:ring-primary focus:border-primary dark:text-white text-center ${isQuantityTouched && drugError?.quantity ? 'border-red-500 focus:border-red-500' : ''}`}
                                  type="number"
                                  value={drug.quantity ?? ''}
                                  onChange={(e) =>
                                    handleDrugChange(
                                      drug.id,
                                      'quantity',
                                      e.target.value === '' ? undefined : Number(e.target.value),
                                    )
                                  }
                                  onBlur={() => handleBlur(`drugs.${drug.id}.quantity`)}
                                />
                                {(isQuantityTouched || Object.keys(errors).length > 0) &&
                                  drugError?.quantity && (
                                    <p className="text-[10px] text-red-500 mt-0.5">
                                      {drugError.quantity}
                                    </p>
                                  )}
                              </td>
                              <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                                {drug.unit}
                              </td>
                              <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">
                                Rp {price.toLocaleString('id-ID')}
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-slate-800 dark:text-white">
                                Rp {total.toLocaleString('id-ID')}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <Button
                                  type="button"
                                  onClick={() => removeDrug(drug.id)}
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 h-8 w-8 rounded-lg"
                                >
                                  <span className="material-icons-round text-lg">delete</span>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Button
                    type="button"
                    onClick={addDrug}
                    variant="ghost"
                    className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl py-6 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary hover:bg-transparent transition-all group h-auto"
                  >
                    <span className="material-icons-round group-hover:scale-110 transition-transform">
                      add_circle
                    </span>
                    <span className="font-bold text-sm">Tambah Obat Lain</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Tindakan Section */}
            <div className="bg-white dark:bg-card-dark rounded-[20px] p-6 shadow-soft h-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-brand-dark dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600">
                    <span className="material-icons-round text-lg">medical_services</span>
                  </span>
                  Jasa
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {Object.entries(servicesByCategory).map(([catName, catSvcs]) =>
                  renderCategoryRow(catName, catSvcs),
                )}

                <div className="mt-2 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 font-medium">Subtotal Jasa</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      Rp {totalServices.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-[20px] p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <h3 className="font-bold text-lg mb-4 relative z-10">Ringkasan Biaya</h3>
              <div className="flex flex-col gap-3 relative z-10 mb-6">
                <div className="flex justify-between text-sm text-blue-100">
                  <span>Total Obat (Estimasi)</span>
                  <span>Rp {totalDrugs.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm text-blue-100">
                  <span>Total Tindakan</span>
                  <span>Rp {totalServices.toLocaleString('id-ID')}</span>
                </div>
                <div className="space-y-2 rounded-xl bg-white/10 p-3">
                  <label className="block text-sm font-medium text-white/90">Biaya Layanan</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={serviceFee === 0 ? '' : serviceFee}
                      onChange={(e) =>
                        setServiceFee(
                          e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
                        )
                      }
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/40"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2 rounded-xl bg-white/10 p-3">
                  <label className="block text-sm font-medium text-white/90">Diskon</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={discount === 0 ? '' : discount}
                      onChange={(e) =>
                        setDiscount(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))
                      }
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/40"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="h-px bg-white/20 my-1"></div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-white/90">Total Tagihan</span>
                  <span className="text-2xl font-bold">
                    Rp {Math.max(0, totalAmount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full bg-white text-primary hover:bg-blue-50 font-bold py-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 relative z-10 text-lg h-auto"
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

      {activeLookupId && (
        <ProductLookupModal
          products={products}
          onClose={() => setActiveLookupId(null)}
          onSelect={(product) => {
            handleDrugChange(activeLookupId, 'productId', product.id);
            setActiveLookupId(null);
          }}
        />
      )}
    </div>
  );
};

export default StockOutRequestForm;
