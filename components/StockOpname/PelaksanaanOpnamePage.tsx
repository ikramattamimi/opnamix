import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { OpnameItem } from '../../types';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { calculateOpnameDifference } from '../../lib/opnameCalc';
import ConfirmationModal from '../ConfirmationModal';
import { useToast } from '../ui/toast';

const PelaksanaanOpnamePage: React.FC = () => {
  const { opnameId } = useParams<{ opnameId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [opnameData, setOpnameData] = useState<any>(null);
  const [items, setItems] = useState<OpnameItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [finalStocks, setFinalStocks] = useState<Record<string, number>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [scheduleObatIds, setScheduleObatIds] = useState<string[]>([]);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Ya',
    onConfirm: () => {},
  });

  // Backward navigation warning state
  const [showBackwardWarning, setShowBackwardWarning] = useState(false);

  useEffect(() => {
    loadOpname();
  }, [opnameId]);

  const loadOpname = async () => {
    if (!opnameId) return;
    try {
      const data = await api.getOpnameById(opnameId);
      setOpnameData(data);
      setCurrentStep(data.currentStep || 1);
      const scheduleObats: string[] = (data.scheduleObatIds || []).map(String);
      setScheduleObatIds(scheduleObats);

      // Always load all products for step 1 selection
      const products = await api.getProducts({ page: 1, perPage: 1000 });
      setAllProducts(products.data || []);

      if (data.items.length > 0) {
        setItems(data.items);
        const ids = new Set<string>(data.items.map((i: OpnameItem) => i.productId));
        setSelectedIds(ids);

        // Pre-fill existing data
        const counts: Record<string, number> = {};
        const finals: Record<string, number> = {};
        const rsns: Record<string, string> = {};
        data.items.forEach((item: OpnameItem) => {
          // Load semua nilai stok_fisik, termasuk 0, agar tidak berulang kali
          // dianggap "belum diisi" saat save draft berikutnya
          if (item.physicalStock !== undefined && item.physicalStock !== null) {
            counts[item.id] = item.physicalStock!;
          }
          if (item.stokFinal !== undefined && item.stokFinal !== null) {
            finals[item.id] = item.stokFinal!;
          }
          if (item.reason) {
            rsns[item.id] = item.reason;
          }
        });
        setPhysicalCounts(counts);
        setFinalStocks(finals);
        setReasons(rsns);
      } else {
        // Pre-select: use selectedObatIds if already saved, otherwise use schedule's obat list
        if (data.selectedObatIds && data.selectedObatIds.length > 0) {
          const selectedIdSet = new Set(data.selectedObatIds.map(String));
          const filteredProducts = (products.data || []).filter((p: any) =>
            selectedIdSet.has(String(p.id)),
          );
          setSelectedIds(new Set(filteredProducts.map((p: any) => String(p.id))));
        } else if (scheduleObats.length > 0) {
          // Pre-select all products from schedule
          const scheduleIdSet = new Set(scheduleObats);
          const filteredProducts = (products.data || []).filter((p: any) =>
            scheduleIdSet.has(String(p.id)),
          );
          setSelectedIds(new Set(filteredProducts.map((p: any) => String(p.id))));
        } else {
          // No schedule filter = select all
          setSelectedIds(new Set((products.data || []).map((p: any) => String(p.id))));
        }
      }
    } catch (error) {
      console.error('Failed to load opname:', error);
      showToast('Gagal memuat data opname.', 'error');
      navigate('/audit/stok-opname/riwayat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!opnameId) return;
    setIsSaving(true);
    try {
      const detailUpdates = items
        .filter((item) => selectedIds.has(item.productId))
        .map((item) => ({
          detailId: item.id,
          physicalStock: physicalCounts[item.id],
          stokFinal: finalStocks[item.id],
          reason: reasons[item.id],
        }));

      // Gunakan saveDetailOnly agar current_step di DB TIDAK berubah saat simpan draft.
      // Perubahan step hanya boleh terjadi saat user klik "Lanjutkan" (handleNextStep).
      await api.saveDetailOnly(opnameId, detailUpdates);
      showToast('Draft tersimpan.', 'success');
    } catch (error) {
      console.error('Failed to save draft:', error);
      showToast('Gagal menyimpan draft.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Complete Step 1: Create detail rows with selected products
      setIsSaving(true);
      try {
        const selectedProductIds: string[] = Array.from(selectedIds);

        // Use completeStepOne to create detail rows
        await api.completeStepOne(opnameId!, selectedProductIds);

        // Reload opname data to get the newly created detail rows
        const data = await api.getOpnameById(opnameId!);
        setOpnameData(data);
        setItems(data.items);
        setSelectedIds(new Set(data.items.map((i: OpnameItem) => i.productId)));
        setPhysicalCounts({});
        setFinalStocks({});
        setReasons({});

        setCurrentStep(2);
      } catch (error) {
        console.error('Failed to complete step one:', error);
        showToast('Gagal menyimpan pemilihan obat.', 'error');
      } finally {
        setIsSaving(false);
      }
    } else if (currentStep === 2) {
      // Save physical counts then move to step 3
      const detailUpdates = items
        .filter((item) => selectedIds.has(item.productId))
        .map((item) => ({
          detailId: item.id,
          physicalStock: physicalCounts[item.id] || 0,
        }));
      await api.saveDraft(opnameId!, 3, detailUpdates);
      setCurrentStep(3);

      // Create notification for step 2→3 transition
      await api.createNotification({
        type: 'OPNAME_STEP_CHANGED',
        title: 'Opname Memasuki Tahap 3',
        message: `Opname ${opnameData?.opnameNumber} telah memasuki tahap 3: Penyesuaian Stok.`,
        data: { opname_id: parseInt(opnameId!), opname_number: opnameData?.opnameNumber, step: 3 },
        target_roles: ['admin', 'apoteker', 'farmasi'],
      });

      // Pre-fill final stocks with physical counts
      const preFills: Record<string, number> = {};
      items.forEach((item) => {
        if (selectedIds.has(item.productId)) {
          preFills[item.id] = physicalCounts[item.id] || 0;
        }
      });
      setFinalStocks((prev) => ({ ...preFills, ...prev }));
    }
  };

  const handleBackward = () => {
    if (currentStep !== 2) return; // Only allow backward from step 2
    setShowBackwardWarning(true);
  };

  const confirmBackward = async () => {
    setShowBackwardWarning(false);
    if (currentStep !== 2) return; // Safety guard
    setIsSaving(true);

    try {
      // Going back from step 2 to step 1:
      // Delete all detail rows and reset to step 1
      await api.backwardToStepOne(opnameId!, scheduleObatIds);

      // Reload opname data
      const data = await api.getOpnameById(opnameId!);
      setOpnameData(data);
      setItems([]);
      setPhysicalCounts({});
      setFinalStocks({});
      setReasons({});

      // Restore products and selection from schedule's obat_ids
      const products = await api.getProducts({ page: 1, perPage: 1000 });
      setAllProducts(products.data || []);

      const scheduleObats = (data.scheduleObatIds || []).map(String);
      if (scheduleObats.length > 0) {
        const scheduleIdSet = new Set(scheduleObats);
        const filteredProducts = (products.data || []).filter((p: any) =>
          scheduleIdSet.has(String(p.id)),
        );
        setSelectedIds(new Set(filteredProducts.map((p: any) => String(p.id))));
      } else {
        setSelectedIds(new Set((products.data || []).map((p: any) => String(p.id))));
      }

      setCurrentStep(1);

      // Notify: backward 2→1
      await api.createNotification({
        type: 'OPNAME_STEP_CHANGED',
        title: 'Opname Kembali ke Tahap 1',
        message: `Opname ${opnameData?.opnameNumber} kembali ke tahap 1: Pemilihan Obat. Progress tahap 2 telah dihapus.`,
        data: {
          opname_id: parseInt(opnameId!),
          opname_number: opnameData?.opnameNumber,
          step: 1,
          action: 'backward',
        },
        target_roles: ['admin', 'apoteker', 'farmasi'],
      });
    } catch (error) {
      console.error('Failed to go backward:', error);
      showToast('Gagal kembali ke tahap sebelumnya.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinishOpname = async () => {
    if (!opnameId) return;

    // Validate: Reasons required for items with selisih !== 0
    const selectedItems = items.filter((item) => selectedIds.has(item.productId));
    for (const item of selectedItems) {
      const diff = calculateOpnameDifference(physicalCounts[item.id], item.systemStock);
      if (diff !== 0 && (!reasons[item.id] || reasons[item.id].trim() === '')) {
        showToast(
          `Alasan perbedaan wajib diisi untuk "${item.productName}" karena selisih stok ≠ 0.`,
          'warning',
        );
        return;
      }
    }

    // Show confirmation modal
    setConfirmModal({
      isOpen: true,
      title: 'Selesaikan Opname?',
      message:
        'Stok akan diperbarui sesuai hasil opname. Pastikan semua data sudah benar sebelum melanjutkan. Tindakan ini tidak dapat dibatalkan.',
      type: 'warning',
      confirmText: 'Ya, Selesaikan',
      onConfirm: doFinishOpname,
    });
  };

  const doFinishOpname = async () => {
    if (!opnameId) return;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setIsSaving(true);
    try {
      const selectedItems = items.filter((item) => selectedIds.has(item.productId));
      const detailUpdates = selectedItems.map((item) => ({
        detailId: item.id,
        physicalStock: physicalCounts[item.id] || 0,
        stokFinal: finalStocks[item.id] ?? physicalCounts[item.id] ?? 0,
        reason: reasons[item.id] || '',
      }));

      await api.saveDraft(opnameId, 3, detailUpdates);
      await api.finishOpname(opnameId);

      // Create notification for opname completed
      await api.createNotification({
        type: 'OPNAME_COMPLETED',
        title: 'Opname Selesai',
        message: `Opname ${opnameData?.opnameNumber} telah selesai. Stok telah diperbarui sesuai hasil opname.`,
        data: { opname_id: parseInt(opnameId!), opname_number: opnameData?.opnameNumber },
        target_roles: ['admin', 'apoteker', 'farmasi'],
      });

      navigate('/audit/stok-opname/riwayat');
    } catch (error) {
      console.error('Failed to finish opname:', error);
      showToast('Gagal menyelesaikan opname.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelect = (productId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === allProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allProducts.map((p) => p.id)));
    }
  };

  const steps = [
    { num: 1, label: 'Pemilihan Obat', icon: 'checklist' },
    { num: 2, label: 'Input Stok Fisik', icon: 'inventory' },
    { num: 3, label: 'Penyesuaian Stok', icon: 'compare_arrows' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="material-icons-round text-primary text-4xl animate-spin">refresh</span>
          <p className="mt-2 text-sm text-text-secondary-light">Memuat data opname...</p>
        </div>
      </div>
    );
  }

  const selectedItems = items.filter((item) => selectedIds.has(item.productId));

  return (
    <>
      <div className="md:flex md:gap-6 md:items-start min-h-screen">
        {/* Left Column - Main Content */}
        <div className="md:w-full space-y-6 md:flex-1">
          {/* Stepper */}
          <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Opname — {opnameData?.scheduleName || 'Opname'}</h2>
              <span className="text-xs font-bold text-text-secondary-light">
                {opnameData?.opnameNumber}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.num}>
                  <div
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all',
                      currentStep === step.num &&
                        'bg-primary text-white shadow-lg shadow-primary/20',
                      currentStep > step.num &&
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                      currentStep < step.num &&
                        'bg-background-light dark:bg-background-dark text-text-secondary-light',
                    )}
                  >
                    <span className="material-icons-round text-sm">
                      {currentStep > step.num ? 'check_circle' : step.icon}
                    </span>
                    <span className="text-xs font-bold hidden sm:inline">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 rounded',
                        currentStep > step.num ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700',
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step 1: Pemilihan Obat */}
          {currentStep === 1 && (
            <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Tahap 1: Pemilihan Obat</h3>
                  <p className="text-sm text-text-secondary-light">
                    Pilih obat yang akan di-opname. {selectedIds.size} dari {allProducts.length}{' '}
                    dipilih.
                  </p>
                </div>
                <button
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  {selectedIds.size === allProducts.length ? 'Batalkan Semua' : 'Pilih Semua'}
                </button>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-100 dark:border-gray-800">
                    <tr className="text-xs uppercase font-bold text-text-secondary-light tracking-wider">
                      <th className="px-4 py-3 w-12"></th>
                      <th className="px-4 py-3 w-full text-center">Nama Produk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {allProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => toggleSelect(product.id)}
                      >
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(product.id)}
                            onChange={() => toggleSelect(product.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-sm">{product.name}</p>
                          <p className="text-xs text-text-secondary-light">
                            {product.category} · {product.unit}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 2: Input Stok Fisik */}
          {currentStep === 2 && (
            <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
              <div className="mb-6">
                <h3 className="text-lg font-bold">Tahap 2: Input Stok Fisik</h3>
                <p className="text-sm text-text-secondary-light">
                  Masukkan jumlah stok fisik hasil penghitungan di gudang.
                </p>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-6 flex items-center gap-3">
                <span className="material-icons-round text-blue-500">visibility_off</span>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Blind Count: Stok sistem disembunyikan untuk menjaga objektivitas.
                </p>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto mb-6">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-100 dark:border-gray-800">
                    <tr className="text-xs uppercase font-bold text-text-secondary-light tracking-wider">
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3 w-48 text-center bg-primary/5 rounded-t-xl">
                        Jumlah Stok Fisik
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {selectedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <p className="font-bold text-sm">{item.productName}</p>
                          <p className="text-xs text-text-secondary-light">
                            {item.category} · {item.unit}
                          </p>
                        </td>
                        <td className="px-4 py-4 bg-primary/5">
                          <input
                            type="number"
                            min="0"
                            value={physicalCounts[item.id] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setPhysicalCounts((prev) => {
                                  const next = { ...prev };
                                  delete next[item.id];
                                  return next;
                                });
                              } else {
                                setPhysicalCounts((prev) => ({
                                  ...prev,
                                  [item.id]: parseInt(val),
                                }));
                              }
                            }}
                            placeholder="0"
                            className="w-full bg-white dark:bg-card-dark border-2 border-primary/20 focus:border-primary focus:ring-0 rounded-xl text-center font-bold text-lg py-3 shadow-sm placeholder:text-gray-300"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2 mb-6">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-background-light dark:bg-background-dark rounded-xl pt-1 pb-3 px-3 space-y-2 flex gap-2 items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-sm">{item.productName}</p>
                      <p className="text-xs text-text-secondary-light">
                        {item.category} · {item.unit}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-secondary-light tracking-wider mb-1.5 block">
                        Stok Fisik
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={physicalCounts[item.id] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setPhysicalCounts((prev) => {
                              const next = { ...prev };
                              delete next[item.id];
                              return next;
                            });
                          } else {
                            setPhysicalCounts((prev) => ({ ...prev, [item.id]: parseInt(val) }));
                          }
                        }}
                        placeholder="0"
                        className="w-20 text-sm bg-white dark:bg-card-dark border-2 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none rounded-md text-center font-bold py-1 shadow-sm placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Penyesuaian Stok */}
          {currentStep === 3 && (
            <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
              <div className="mb-6">
                <h3 className="text-lg font-bold">Tahap 3: Penyesuaian Stok</h3>
                <p className="text-sm text-text-secondary-light">
                  Review selisih dan tentukan stok final. Alasan wajib diisi jika ada selisih.
                </p>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto mb-6">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-100 dark:border-gray-800">
                    <tr className="text-xs uppercase font-bold text-text-secondary-light tracking-wider">
                      <th className="px-3 py-3">Nama Produk</th>
                      <th className="px-3 py-3 text-center">Stok Sistem</th>
                      <th className="px-3 py-3 text-center">Stok Fisik</th>
                      <th className="px-3 py-3 text-center">Selisih</th>
                      <th className="px-3 py-3 text-center w-32">Stok Final</th>
                      <th className="px-3 py-3 w-64">Alasan Perbedaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {selectedItems.map((item) => {
                      const physical = physicalCounts[item.id] || 0;
                      const diff = calculateOpnameDifference(physical, item.systemStock);
                      const hasDiff = diff !== 0;

                      return (
                        <tr
                          key={item.id}
                          className={cn('transition-colors', hasDiff && 'bg-amber-500/[0.03]')}
                        >
                          <td className="px-3 py-4">
                            <p className="font-bold text-sm">{item.productName}</p>
                          </td>
                          <td className="px-3 py-4 text-center font-medium text-sm opacity-60">
                            {item.systemStock}
                          </td>
                          <td className="px-3 py-4 text-center font-bold text-sm text-primary">
                            {physical}
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span
                              className={cn(
                                'font-bold px-2 py-1 rounded-full text-xs',
                                diff > 0
                                  ? 'bg-green-100 text-green-600'
                                  : diff < 0
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-gray-100 text-text-secondary-light',
                              )}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <input
                              type="number"
                              min="0"
                              value={
                                item.id in finalStocks
                                  ? (finalStocks[item.id] ?? '')
                                  : (physicalCounts[item.id] ?? '')
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                setFinalStocks((prev) => ({
                                  ...prev,
                                  [item.id]: val === '' ? (undefined as any) : parseInt(val),
                                }));
                              }}
                              className="w-full bg-background-light dark:bg-background-dark border-none rounded-xl px-3 py-2 text-center text-sm font-bold"
                            />
                          </td>
                          <td className="px-3 py-4">
                            {hasDiff ? (
                              <div className="relative">
                                <textarea
                                  placeholder="Masukkan alasan..."
                                  value={reasons[item.id] || ''}
                                  onChange={(e) =>
                                    setReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                                  }
                                  rows={2}
                                  className="w-full bg-background-light dark:bg-background-dark border-none rounded-xl px-3 py-2 text-sm font-medium resize-none"
                                />
                                {!reasons[item.id] && (
                                  <span className="absolute right-2 top-2 text-[10px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded uppercase">
                                    Wajib
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                <span className="material-icons-round text-xs">verified</span>{' '}
                                Sesuai
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3 mb-6">
                {selectedItems.map((item) => {
                  const physical = physicalCounts[item.id] || 0;
                  const diff = calculateOpnameDifference(physical, item.systemStock);
                  const hasDiff = diff !== 0;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'bg-background-light dark:bg-background-dark rounded-2xl p-4 space-y-3',
                        hasDiff && 'ring-1 ring-amber-300/30',
                      )}
                    >
                      <p className="font-bold text-sm">{item.productName}</p>

                      {/* 3-col mini grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-card-light dark:bg-card-dark rounded-xl py-2">
                          <p className="text-[10px] font-bold text-text-secondary-light uppercase">
                            Sistem
                          </p>
                          <p className="text-sm font-bold opacity-60">{item.systemStock}</p>
                        </div>
                        <div className="bg-card-light dark:bg-card-dark rounded-xl py-2">
                          <p className="text-[10px] font-bold text-text-secondary-light uppercase">
                            Fisik
                          </p>
                          <p className="text-sm font-bold text-primary">{physical}</p>
                        </div>
                        <div className="bg-card-light dark:bg-card-dark rounded-xl py-2">
                          <p className="text-[10px] font-bold text-text-secondary-light uppercase">
                            Selisih
                          </p>
                          <span
                            className={cn(
                              'text-sm font-bold',
                              diff > 0
                                ? 'text-green-600'
                                : diff < 0
                                  ? 'text-red-600'
                                  : 'text-text-secondary-light',
                            )}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </div>
                      </div>

                      {/* Stok Final */}
                      <div>
                        <label className="text-xs font-bold text-text-secondary-light uppercase tracking-wider mb-1.5 block">
                          Stok Final
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={
                            item.id in finalStocks
                              ? (finalStocks[item.id] ?? '')
                              : (physicalCounts[item.id] ?? '')
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setFinalStocks((prev) => ({
                              ...prev,
                              [item.id]: val === '' ? (undefined as any) : parseInt(val),
                            }));
                          }}
                          className="w-full bg-card-light dark:bg-card-dark border-none rounded-xl px-3 py-2.5 text-center text-sm font-bold"
                        />
                      </div>

                      {/* Alasan */}
                      {hasDiff ? (
                        <div className="relative">
                          <label className="text-xs font-bold text-text-secondary-light uppercase tracking-wider mb-1.5 block">
                            Alasan Perbedaan
                          </label>
                          <textarea
                            placeholder="Masukkan alasan..."
                            value={reasons[item.id] || ''}
                            onChange={(e) =>
                              setReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            rows={2}
                            className="w-full bg-card-light dark:bg-card-dark border-none rounded-xl px-3 py-2 text-sm font-medium resize-none"
                          />
                          {!reasons[item.id] && (
                            <span className="absolute right-2 top-8 text-[10px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded uppercase">
                              Wajib
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                          <span className="material-icons-round text-xs">verified</span> Sesuai
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions Sidebar - Desktop Only */}
        <div className="hidden md:block md:w-[25%] sticky top-32 ">
          <div className="space-y-4">
            {/* Actions Card */}
            <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
              <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                <span className="material-icons-round text-primary text-lg">bolt</span>
                Tindakan
              </h3>

              <div className="space-y-3">
                {/* Info Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-900">
                  <div className="flex items-start gap-3">
                    <span className="material-icons-round text-blue-600 dark:text-blue-400 text-lg">
                      info
                    </span>
                    <div>
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">
                        Tahap {currentStep}/3
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                        {currentStep === 1 && 'Pilih produk yang akan di-opname'}
                        {currentStep === 2 && 'Input jumlah stok fisik hasil penghitungan'}
                        {currentStep === 3 && 'Review dan selesaikan penyesuaian stok'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Primary Action */}
                {currentStep < 3 ? (
                  <Button
                    onClick={handleNextStep}
                    disabled={(currentStep === 1 && selectedIds.size === 0) || isSaving}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-auto py-3.5 shadow-lg shadow-primary/20 disabled:bg-gray-300"
                  >
                    <span className="material-icons-round text-sm mr-2">arrow_forward</span>
                    {isSaving ? 'Memproses...' : 'Lanjutkan'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinishOpname}
                    disabled={isSaving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-auto py-3.5 shadow-lg shadow-emerald-600/20 disabled:bg-gray-300"
                  >
                    <span className="material-icons-round text-sm mr-2">verified_user</span>
                    {isSaving ? 'Memproses...' : 'Selesaikan Opname'}
                  </Button>
                )}

                {/* Save Draft */}
                <Button
                  variant="ghost"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="w-full font-bold rounded-xl h-auto py-3 border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary"
                >
                  <span className="material-icons-round text-sm mr-2">save</span>
                  {isSaving ? 'Menyimpan...' : 'Simpan Draft'}
                </Button>

                <div className="border-t border-gray-100 dark:border-gray-800 my-4"></div>

                {/* Back — only available at step 2 */}
                {currentStep === 2 && (
                  <Button
                    variant="ghost"
                    onClick={handleBackward}
                    disabled={isSaving}
                    className="w-full font-bold rounded-xl h-auto py-3 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <span className="material-icons-round text-sm mr-2">arrow_back</span>
                    Kembali
                  </Button>
                )}

                {/* Exit */}
                <Button
                  variant="ghost"
                  onClick={() => navigate('/audit/stok-opname/riwayat')}
                  className="w-full font-bold rounded-xl h-auto py-3 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <span className="material-icons-round text-sm mr-2">logout</span>
                  Keluar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions — Mobile: fixed bottom bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card-light dark:bg-card-dark border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 space-y-2.5">
        {/* Primary action row */}
        <div className="flex gap-2">
          {currentStep < 3 ? (
            <Button
              onClick={handleNextStep}
              disabled={(currentStep === 1 && selectedIds.size === 0) || isSaving}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-auto py-3 shadow-lg shadow-primary/20 disabled:bg-gray-300"
            >
              {isSaving ? 'Memproses...' : 'Lanjutkan'}
              <span className="material-icons-round text-sm ml-1.5">arrow_forward</span>
            </Button>
          ) : (
            <Button
              onClick={handleFinishOpname}
              disabled={isSaving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-auto py-3 shadow-lg shadow-emerald-600/20 disabled:bg-gray-300"
            >
              <span className="material-icons-round text-sm mr-1.5">verified_user</span>
              {isSaving ? 'Memproses...' : 'Selesaikan Opname'}
            </Button>
          )}
        </div>

        {/* Secondary actions row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Back — only available at step 2 */}
            {currentStep === 2 && (
              <Button
                variant="ghost"
                onClick={handleBackward}
                disabled={isSaving}
                className="font-bold rounded-xl px-3 h-auto py-2 text-xs"
              >
                <span className="material-icons-round text-sm mr-0.5">arrow_back</span>
                Kembali
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => navigate('/audit/stok-opname/riwayat')}
              className="font-bold rounded-xl px-3 h-auto py-2 text-xs text-text-secondary-light"
            >
              Keluar
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="font-bold rounded-xl px-3 h-auto py-2 text-xs border border-gray-200 dark:border-gray-700"
          >
            <span className="material-icons-round text-sm mr-1">save</span>
            {isSaving ? 'Menyimpan...' : 'Draft'}
          </Button>
        </div>
      </div>

      {/* Mobile bottom spacer to prevent content from being hidden behind fixed bar */}
      <div className="sm:hidden h-28" />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Backward Navigation Warning Modal — step 2 → step 1 only */}
      <ConfirmationModal
        isOpen={showBackwardWarning}
        title="Kembali ke Tahap 1?"
        message="⚠️ Kembali ke tahap 1 akan menghapus semua progress input stok fisik. Anda harus memilih ulang obat yang akan di-opname. Lanjutkan?"
        type="warning"
        confirmText="Ya, Kembali"
        onConfirm={confirmBackward}
        onCancel={() => setShowBackwardWarning(false)}
      />
    </>
  );
};

export default PelaksanaanOpnamePage;
