import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useBackwardOpnameToStepOne,
  useCompleteOpnameStepOne,
  useFetchOpname,
  useFinishOpname,
  useMoveOpnameStep,
  useOpname,
  useSaveOpnameDraft,
} from '../../useOpname';
import { useFetchOpnameProducts, useOpnameProducts } from '../../useOpnameProducts';
import { OpnameItem } from '../../types';
import { Product } from '@/features/products/types';
import { calculateOpnameDifference } from '../../opnameCalc';
import { useToast } from '@/components/ui/toast';

const NO_PRODUCTS: Product[] = [];
const RIWAYAT_PATH = '/audit/stok-opname/riwayat';

export type StockInputs = Record<string, number | undefined>;

// Produk yang dipilih awal di langkah 1: dari jadwal kalau ada, selain itu semua
const scheduleSelection = (products: Product[], scheduleObatIds: string[]) => {
  if (scheduleObatIds.length === 0) return new Set(products.map((p) => String(p.id)));
  const scheduleIdSet = new Set(scheduleObatIds);
  return new Set(products.filter((p) => scheduleIdSet.has(String(p.id))).map((p) => String(p.id)));
};

// State form pelaksanaan opname (tiga langkah) beserta aksi tiap langkah.
// Setiap aksi memakai mutation dari useOpname.
export function useOpnameExecution(opnameId: string | undefined) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const opnameQuery = useOpname(opnameId);
  const productsQuery = useOpnameProducts();
  const fetchOpname = useFetchOpname();
  const fetchProducts = useFetchOpnameProducts();
  const completeStepOne = useCompleteOpnameStepOne();
  const backwardToStepOne = useBackwardOpnameToStepOne();
  const moveStep = useMoveOpnameStep();
  const saveDraft = useSaveOpnameDraft();
  const finishOpname = useFinishOpname();
  const opnameData = opnameQuery.data ?? null;
  const allProducts = productsQuery.data?.data ?? NO_PRODUCTS;
  const [currentStep, setCurrentStep] = useState(1);
  // Opname yang sudah dimuat ke state form di bawah
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const isLoading = loadedId !== opnameId;
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState<OpnameItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [physicalCounts, setPhysicalCounts] = useState<StockInputs>({});
  const [finalStocks, setFinalStocks] = useState<StockInputs>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [scheduleObatIds, setScheduleObatIds] = useState<string[]>([]);

  // Isi state form sekali per opname, dari data server terbaru. Refetch
  // berikutnya (setelah mutasi) tidak menimpa isian yang belum disimpan.
  const opnameError = opnameQuery.error ?? productsQuery.error;
  const loadedOpname = opnameQuery.isFetching ? undefined : opnameQuery.data;
  const loadedProducts = productsQuery.isFetching ? undefined : productsQuery.data?.data;
  useEffect(() => {
    if (!opnameId || loadedId === opnameId) return;

    if (opnameError) {
      console.error('Failed to load opname:', opnameError);
      showToast('Gagal memuat data opname.', 'error');
      navigate(RIWAYAT_PATH);
      setLoadedId(opnameId);
      return;
    }
    if (!loadedOpname || !loadedProducts) return;

    const data = loadedOpname;
    setCurrentStep(data.currentStep || 1);
    const scheduleObats: string[] = (data.scheduleObatIds || []).map(String);
    setScheduleObatIds(scheduleObats);

    if (data.items.length > 0) {
      // Lanjut dari draft: isi ulang semua nilai yang sudah tersimpan
      setItems(data.items);
      setSelectedIds(new Set<string>(data.items.map((i: OpnameItem) => i.productId)));
      const counts: Record<string, number> = {};
      const finals: Record<string, number> = {};
      const rsns: Record<string, string> = {};
      data.items.forEach((item: OpnameItem) => {
        // Load semua nilai stok_fisik, termasuk 0, agar tidak berulang kali
        // dianggap "belum diisi" saat save draft berikutnya
        if (item.physicalStock !== undefined && item.physicalStock !== null) {
          counts[item.id] = item.physicalStock;
        }
        if (item.stokFinal !== undefined && item.stokFinal !== null) {
          finals[item.id] = item.stokFinal;
        }
        if (item.reason) {
          rsns[item.id] = item.reason;
        }
      });
      setPhysicalCounts(counts);
      setFinalStocks(finals);
      setReasons(rsns);
    } else if (data.selectedObatIds && data.selectedObatIds.length > 0) {
      // Pilihan obat yang sudah tersimpan
      setSelectedIds(scheduleSelection(loadedProducts, data.selectedObatIds.map(String)));
    } else {
      setSelectedIds(scheduleSelection(loadedProducts, scheduleObats));
    }
    setLoadedId(opnameId);
  }, [opnameId, loadedId, opnameError, loadedOpname, loadedProducts, showToast, navigate]);

  const selectedItems = items.filter((item) => selectedIds.has(item.productId));

  const handleSaveDraft = async () => {
    if (!opnameId) return;
    setIsSaving(true);
    try {
      const detailUpdates = selectedItems.map((item) => ({
        detailId: item.id,
        physicalStock: physicalCounts[item.id],
        stokFinal: finalStocks[item.id],
        reason: reasons[item.id],
      }));

      // Gunakan saveDetailOnly agar current_step di DB TIDAK berubah saat simpan draft.
      // Perubahan step hanya boleh terjadi saat user klik "Lanjutkan" (handleNextStep).
      await saveDraft.mutateAsync({ opnameId, updates: detailUpdates });
      showToast('Draft tersimpan.', 'success');
    } catch (error) {
      console.error('Failed to save draft:', error);
      showToast('Gagal menyimpan draft.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Langkah 1 → 2: buat baris detail untuk obat yang dipilih
  const completeSelection = async () => {
    setIsSaving(true);
    try {
      await completeStepOne.mutateAsync({
        opnameId: opnameId!,
        productIds: Array.from(selectedIds),
      });

      // Data opname terbaru (sudah di-refresh oleh mutasi) untuk detail yang baru dibuat
      const data = await fetchOpname(opnameId!);
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
  };

  // Langkah 2 → 3: simpan stok fisik, lalu stok final diisi awal dengan stok fisik
  const completePhysicalCount = async () => {
    const detailUpdates = selectedItems.map((item) => ({
      detailId: item.id,
      physicalStock: physicalCounts[item.id] || 0,
    }));
    // Notifikasi masuk tahap 3 dikirim oleh hook
    await moveStep.mutateAsync({
      opnameId: opnameId!,
      step: 3,
      updates: detailUpdates,
      opnameNumber: opnameData?.opnameNumber,
    });
    setCurrentStep(3);

    const preFills: Record<string, number> = {};
    selectedItems.forEach((item) => {
      preFills[item.id] = physicalCounts[item.id] || 0;
    });
    setFinalStocks((prev) => ({ ...preFills, ...prev }));
  };

  const handleNextStep = async () => {
    if (currentStep === 1) await completeSelection();
    else if (currentStep === 2) await completePhysicalCount();
  };

  // Langkah 2 → 1: detail dihapus, pilihan obat kembali dari jadwal
  const confirmBackward = async () => {
    if (currentStep !== 2) return; // Hanya boleh mundur dari langkah 2
    setIsSaving(true);

    try {
      // Notifikasi kembali ke tahap 1 dikirim oleh hook
      await backwardToStepOne.mutateAsync({
        opnameId: opnameId!,
        scheduleObatIds,
        opnameNumber: opnameData?.opnameNumber,
      });

      // Data opname terbaru (sudah di-refresh oleh mutasi)
      const data = await fetchOpname(opnameId!);
      setItems([]);
      setPhysicalCounts({});
      setFinalStocks({});
      setReasons({});

      const products = await fetchProducts();
      setSelectedIds(scheduleSelection(products.data, (data.scheduleObatIds || []).map(String)));

      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to go backward:', error);
      showToast('Gagal kembali ke tahap sebelumnya.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Alasan wajib diisi untuk obat yang selisihnya bukan 0. Mengembalikan true kalau lengkap.
  const validateReasons = () => {
    for (const item of selectedItems) {
      const diff = calculateOpnameDifference(physicalCounts[item.id], item.systemStock);
      if (diff !== 0 && (!reasons[item.id] || reasons[item.id].trim() === '')) {
        showToast(
          `Alasan perbedaan wajib diisi untuk "${item.productName}" karena selisih stok ≠ 0.`,
          'warning',
        );
        return false;
      }
    }
    return true;
  };

  const finish = async () => {
    if (!opnameId) return;
    setIsSaving(true);
    try {
      const detailUpdates = selectedItems.map((item) => ({
        detailId: item.id,
        physicalStock: physicalCounts[item.id] || 0,
        stokFinal: finalStocks[item.id] ?? physicalCounts[item.id] ?? 0,
        reason: reasons[item.id] || '',
      }));

      // Notifikasi opname selesai dikirim oleh hook
      await finishOpname.mutateAsync({
        opnameId,
        updates: detailUpdates,
        opnameNumber: opnameData?.opnameNumber,
      });

      navigate(RIWAYAT_PATH);
    } catch (error) {
      console.error('Failed to finish opname:', error);
      showToast('Gagal menyelesaikan opname.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelect = (productId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(productId)) newSet.delete(productId);
    else newSet.add(productId);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === allProducts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(allProducts.map((p) => p.id)));
  };

  return {
    opnameData,
    allProducts,
    isLoading,
    isSaving,
    currentStep,
    selectedIds,
    selectedItems,
    physicalCounts,
    setPhysicalCounts,
    finalStocks,
    setFinalStocks,
    reasons,
    setReasons,
    toggleSelect,
    toggleSelectAll,
    handleSaveDraft,
    handleNextStep,
    confirmBackward,
    validateReasons,
    finish,
    exit: () => navigate(RIWAYAT_PATH),
  };
}

export type OpnameExecution = ReturnType<typeof useOpnameExecution>;
