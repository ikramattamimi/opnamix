import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { OpnameSchedule, Product } from '../../types';
import { Button } from '../ui/button';
import { useToast } from '../ui/toast';
import ConfirmationModal from '../ConfirmationModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

interface ScheduleInfo {
  nextDate: string;
  pengulangan: string;
  nama: string;
  scheduleId: string;
}

interface OpnameCard {
  id: string;
  opnameNumber: string;
  scheduleDate: string;
  status: string;
  scheduleName: string;
  currentStep?: number;
  date?: string;
  itemsCount?: number;
  discrepancyCount?: number;
  createdAt?: string;
}

const RiwayatOpnamePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [upcoming, setUpcoming] = useState<OpnameCard[]>([]);
  const [drafts, setDrafts] = useState<OpnameCard[]>([]);
  const [history, setHistory] = useState<OpnameCard[]>([]);
  const [activeSchedules, setActiveSchedules] = useState<ScheduleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search states
  const [searchUpcoming, setSearchUpcoming] = useState('');
  const [searchHistory, setSearchHistory] = useState('');

  // Mobile schedule collapsed
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);

  // Manual opname modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [allSchedules, setAllSchedules] = useState<OpnameSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [scheduleProducts, setScheduleProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string }>({
    isOpen: false,
    id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [upcomingData, draftData, historyData, schedules] = await Promise.all([
        api.getUpcomingOpnames(),
        api.getDraftOpnames(),
        api.getOpnameHistory(),
        api.getActiveSchedules(),
      ]);
      setUpcoming(upcomingData);
      setDrafts(draftData);
      setHistory(historyData);
      setActiveSchedules(schedules);
    } catch (error) {
      console.error('Failed to load opname data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { dateStyle: 'long' });
  };

  const pengulanganLabel: Record<string, string> = {
    BULANAN: 'Setiap Bulan',
    TRIWULAN: 'Setiap 3 Bulan',
    TAHUNAN: 'Setiap Tahun',
  };

  const stepLabel: Record<number, string> = {
    1: 'Pemilihan Obat',
    2: 'Input Stok Fisik',
    3: 'Penyesuaian Stok',
  };

  const handleDeleteOpname = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const doDeleteOpname = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: '' });
    try {
      await api.deleteOpname(id);
      showToast('Opname berhasil dihapus.', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to delete opname:', error);
      showToast('Gagal menghapus opname.', 'error');
    }
  };

  // Manual opname handlers
  const openManualModal = async () => {
    setShowManualModal(true);
    setSelectedScheduleId('');
    setManualDate(new Date().toISOString().split('T')[0]);
    setScheduleProducts([]);
    try {
      const schedules = await api.getOpnameSchedules();
      setAllSchedules(schedules);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  };

  const handleScheduleSelect = async (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    if (!scheduleId) {
      setScheduleProducts([]);
      return;
    }
    setIsLoadingProducts(true);
    try {
      const schedule = allSchedules.find((s) => s.id === scheduleId);
      const result = await api.getProducts({ page: 1, perPage: 1000 });
      if (schedule?.obatIds === null) {
        setScheduleProducts(result.data);
      } else if (schedule?.obatIds && Array.isArray(schedule.obatIds)) {
        const idSet = new Set(schedule.obatIds.map(String));
        setScheduleProducts(result.data.filter((p) => idSet.has(String(p.id))));
      } else {
        setScheduleProducts([]);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleCreateManualOpname = async () => {
    if (!selectedScheduleId || !manualDate) return;
    setIsCreating(true);
    try {
      // No items passed - details will be created after user selects products in step 1
      await api.startOpname(selectedScheduleId, manualDate);
      setShowManualModal(false);
      showToast(
        'Opname berhasil dibuat. Silakan pilih opname dari daftar untuk melanjutkan.',
        'success',
      );

      // Reload opname list to show the new draft
      loadData();
    } catch (error) {
      console.error('Failed to create manual opname:', error);
      showToast('Gagal membuat opname. Silahkan coba lagi.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Filtered lists
  const filteredDrafts = useMemo(() => {
    if (!searchUpcoming.trim()) return drafts;
    const q = searchUpcoming.toLowerCase();
    return drafts.filter(
      (d) => d.scheduleName.toLowerCase().includes(q) || d.opnameNumber.toLowerCase().includes(q),
    );
  }, [drafts, searchUpcoming]);

  const filteredUpcoming = useMemo(() => {
    if (!searchUpcoming.trim()) return upcoming;
    const q = searchUpcoming.toLowerCase();
    return upcoming.filter(
      (u) => u.scheduleName.toLowerCase().includes(q) || u.opnameNumber.toLowerCase().includes(q),
    );
  }, [upcoming, searchUpcoming]);

  const filteredHistory = useMemo(() => {
    if (!searchHistory.trim()) return history;
    const q = searchHistory.toLowerCase();
    return history.filter(
      (h) => h.scheduleName.toLowerCase().includes(q) || h.opnameNumber.toLowerCase().includes(q),
    );
  }, [history, searchHistory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="material-icons-round text-primary text-4xl animate-spin">refresh</span>
          <p className="mt-2 text-sm text-text-secondary-light">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      {/* ===== MOBILE: Schedule strip at top (collapsed) ===== */}
      <div className="md:hidden mb-4">
        {activeSchedules.length > 0 ? (
          <div className="bg-gradient-to-r from-primary to-indigo-700 rounded-2xl shadow-lg overflow-hidden">
            <button
              onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 text-white"
            >
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-white/80 text-lg">calendar_month</span>
                <span className="text-sm font-bold">{activeSchedules.length} Jadwal Aktif</span>
              </div>
              <span
                className={`material-icons-round text-white/60 transition-transform ${isScheduleExpanded ? 'rotate-180' : ''}`}
              >
                expand_more
              </span>
            </button>
            {isScheduleExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {activeSchedules.map((s) => (
                  <div key={s.scheduleId} className="bg-white/15 rounded-xl px-4 py-2.5">
                    <p className="text-sm font-bold text-white">{s.nama}</p>
                    <p className="text-xs text-white/60">
                      {pengulanganLabel[s.pengulangan] || s.pengulangan} · Berikutnya:{' '}
                      {formatDate(s.nextDate)}
                    </p>
                  </div>
                ))}
                <Button
                  onClick={() => navigate('/audit/stok-opname/konfigurasi')}
                  className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl px-3 py-2.5 h-auto mt-1"
                >
                  <span className="material-icons-round text-xs mr-1">settings</span>
                  Ubah Konfigurasi
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary to-indigo-700 rounded-2xl shadow-lg px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <span className="material-icons-round text-white/60 text-lg">event_busy</span>
              <span className="text-sm font-bold">Belum ada jadwal aktif</span>
            </div>
            <Button
              onClick={() => navigate('/audit/stok-opname/konfigurasi')}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl px-3 py-2 h-auto"
            >
              <span className="material-icons-round text-xs mr-1">add</span>
              Buat Jadwal
            </Button>
          </div>
        )}
      </div>

      {/* ===== MAIN LAYOUT: Sidebar + Content ===== */}
      <div className="md:flex md:gap-6">
        {/* ===== CONTENT (~70%) ===== */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Section: Opname Mendatang & Draft */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <span className="material-icons-round text-amber-500">schedule</span>
              </div>
              <h3 className="text-lg font-bold">Opname Mendatang</h3>
            </div>

            {/* Search upcoming */}
            <div className="relative mb-4">
              <span className="material-icons-round text-text-secondary-light text-sm absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                placeholder="Cari opname mendatang..."
                value={searchUpcoming}
                onChange={(e) => setSearchUpcoming(e.target.value)}
                className="w-full bg-card-light dark:bg-card-dark border-none rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium placeholder:text-text-secondary-light/50 focus:ring-2 focus:ring-primary/20 shadow-soft"
              />
            </div>

            {filteredDrafts.length > 0 && (
              <div className="space-y-3 mb-4">
                {filteredDrafts.map((opname) => (
                  <div
                    key={opname.id}
                    className="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-soft border-l-4 border-blue-500"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-lg">
                            Sedang Dilaksanakan
                          </span>
                          <span className="text-xs text-text-secondary-light">
                            Tahap {opname.currentStep}: {stepLabel[opname.currentStep || 1]}
                          </span>
                        </div>
                        <p className="font-bold text-text-primary-light dark:text-white">
                          {opname.scheduleName}
                        </p>
                        <p className="text-xs text-text-secondary-light">
                          Jadwal: {formatDate(opname.scheduleDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => navigate(`/audit/stok-opname/pelaksanaan/${opname.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 h-auto py-2.5 shadow-lg shadow-blue-600/20"
                        >
                          <span className="material-icons-round text-sm mr-1.5">play_arrow</span>
                          Lanjutkan
                        </Button>
                        <button
                          onClick={() => handleDeleteOpname(opname.id)}
                          className="px-4 p-2.5 font-bold h-auto text-sm rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Hapus Opname"
                        >
                          <span className="material-icons-round text-sm mr-1.5">delete</span>
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredUpcoming.length > 0 ? (
              <div className="space-y-3">
                {filteredUpcoming.map((opname) => (
                  <div
                    key={opname.id}
                    className="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-soft border-l-4 border-amber-400"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg">
                          Belum Dilaksanakan
                        </span>
                        <p className="font-bold text-text-primary-light dark:text-white">
                          {opname.scheduleName}
                        </p>
                        <p className="text-xs text-text-secondary-light">
                          Target: {formatDate(opname.scheduleDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => navigate(`/audit/stok-opname/pelaksanaan/${opname.id}`)}
                          className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-auto py-2.5 shadow-lg shadow-primary/20"
                        >
                          <span className="material-icons-round text-sm mr-1.5">bolt</span>
                          Mulai Opname
                        </Button>
                        <button
                          onClick={() => handleDeleteOpname(opname.id)}
                          className="p-2.5 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Hapus Opname"
                        >
                          <span className="material-icons-round text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !filteredDrafts.length && (
                <div className="bg-card-light dark:bg-card-dark rounded-2xl p-8 shadow-soft text-center">
                  <span className="material-icons-round text-4xl text-text-secondary-light/30 mb-2">
                    event_available
                  </span>
                  <p className="text-sm text-text-secondary-light">
                    {searchUpcoming ? 'Tidak ada hasil yang cocok.' : 'Tidak ada opname mendatang.'}
                  </p>
                </div>
              )
            )}
          </div>

          {/* Section: Riwayat Opname */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <span className="material-icons-round text-emerald-500">history</span>
              </div>
              <h3 className="text-lg font-bold">Riwayat Opname</h3>
            </div>

            {/* Search history */}
            <div className="relative mb-4">
              <span className="material-icons-round text-text-secondary-light text-sm absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                placeholder="Cari riwayat opname..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full bg-card-light dark:bg-card-dark border-none rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium placeholder:text-text-secondary-light/50 focus:ring-2 focus:ring-primary/20 shadow-soft"
              />
            </div>

            {filteredHistory.length > 0 ? (
              <div className="space-y-3">
                {filteredHistory.map((opname) => (
                  <div
                    key={opname.id}
                    className="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-soft hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg flex items-center gap-1">
                            <span className="material-icons-round text-xs">check_circle</span>
                            Selesai
                          </span>
                          {(opname.discrepancyCount || 0) > 0 && (
                            <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 rounded-lg">
                              {opname.discrepancyCount} Selisih
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-text-primary-light dark:text-white">
                          {opname.scheduleName}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-text-secondary-light flex-wrap">
                          <span>
                            Dilaksanakan: {formatDate(opname.date || opname.scheduleDate)}
                          </span>
                          <span className="hidden sm:inline">
                            Jadwal: {formatDate(opname.scheduleDate)}
                          </span>
                          <span>{opname.itemsCount} item</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => navigate(`/audit/stok-opname/detail/${opname.id}`)}
                          className="text-primary font-bold rounded-xl px-4 h-auto py-2.5 hover:bg-primary/10"
                        >
                          <span className="material-icons-round text-sm mr-1.5">visibility</span>
                          Lihat Detail
                        </Button>
                        <Button
                          onClick={() => handleDeleteOpname(opname.id)}
                          variant="ghost"
                          className="rounded-xl font-bold px-4 text-sm h-auto py-2.5 text-red-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Hapus Opname"
                        >
                          <span className="material-icons-round text-sm mr-1.5">delete</span>
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card-light dark:bg-card-dark rounded-2xl p-8 shadow-soft text-center">
                <span className="material-icons-round text-4xl text-text-secondary-light/30 mb-2">
                  inventory
                </span>
                <p className="text-sm text-text-secondary-light italic">
                  {searchHistory ? 'Tidak ada hasil yang cocok.' : 'Belum ada riwayat opname.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ===== SIDEBAR (Desktop only, ~30%) ===== */}
        <div className="hidden md:block md:w-[30%] flex-shrink-0">
          <div className="sticky top-32 space-y-4">
            {/* Schedule Info Panel */}
            <div className="bg-gradient-to-b from-primary to-indigo-700 rounded-2xl shadow-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-white/80 text-lg">calendar_month</span>
                <span className="text-sm font-bold text-white/80">Jadwal Aktif</span>
              </div>

              {activeSchedules.length > 0 ? (
                <div className="space-y-2">
                  {activeSchedules.map((s) => (
                    <div key={s.scheduleId} className="bg-white/15 rounded-xl px-4 py-3">
                      <p className="text-sm font-bold text-white">{s.nama}</p>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        {pengulanganLabel[s.pengulangan] || s.pengulangan}
                      </p>
                      <p className="text-[11px] text-white/60">
                        Berikutnya: {formatDate(s.nextDate)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/10 rounded-xl px-4 py-5 text-center">
                  <span className="material-icons-round text-white/40 text-2xl block mb-1">
                    event_busy
                  </span>
                  <p className="text-xs text-white/60">Belum ada jadwal aktif</p>
                </div>
              )}

              <Button
                onClick={() => navigate('/audit/stok-opname/konfigurasi')}
                className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl px-3 py-2.5 h-auto"
              >
                <span className="material-icons-round text-xs mr-1">settings</span>
                Konfigurasi Jadwal
              </Button>

              {/* Tambah Opname Button (Desktop) */}
              <Button
                onClick={openManualModal}
                className="w-full bg-white hover:bg-primary/90 text-primary font-bold rounded-xl px-4 h-auto py-3 text-sm shadow-lg shadow-primary/20"
              >
                <span className="material-icons-round text-sm mr-1.5">add_circle</span>
                Tambah Opname
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB: Tambah Opname */}
      <button
        onClick={openManualModal}
        className="md:hidden fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-white rounded-full w-14 h-14 shadow-lg shadow-primary/30 flex items-center justify-center z-50 active:scale-95 transition-transform"
        title="Tambah Opname"
      >
        <span className="material-icons-round text-2xl">add</span>
      </button>

      {/* Manual Opname Dialog */}
      <Dialog
        open={showManualModal}
        onOpenChange={(open) => {
          if (!open) setShowManualModal(false);
        }}
      >
        <DialogContent className="sm:max-w-[500px] bg-card-light dark:bg-card-dark rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-bold">Buat Opname Manual</DialogTitle>
            <DialogDescription className="text-sm text-text-secondary-light">
              Pilih jadwal opname dan tentukan tanggal pelaksanaan. Obat yang akan di-opname diambil
              dari jadwal yang dipilih.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-5">
            {/* Schedule selector */}
            <div className="space-y-2">
              <label className="text-sm font-bold opacity-60">Pilih Jadwal Opname</label>
              <select
                value={selectedScheduleId}
                onChange={(e) => handleScheduleSelect(e.target.value)}
                className="w-full bg-background-light dark:bg-background-dark border-none rounded-xl px-4 py-3 text-sm font-medium"
              >
                <option value="">— Pilih jadwal —</option>
                {allSchedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} (Tgl {s.tanggalAudit},{' '}
                    {s.obatIds === null ? 'Semua Obat' : `${(s.obatIds as string[]).length} obat`})
                  </option>
                ))}
              </select>
            </div>

            {/* Date selector */}
            <div className="space-y-2">
              <label className="text-sm font-bold opacity-60">Tanggal Pelaksanaan</label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-background-light dark:bg-background-dark border-none rounded-xl px-4 py-3 text-sm font-medium"
              />
              <p className="text-xs text-text-secondary-light">
                Anda dapat memilih tanggal di luar jadwal yang sudah ditentukan.
              </p>
            </div>

            {/* Products preview */}
            {selectedScheduleId && (
              <div className="space-y-2">
                <label className="text-sm font-bold opacity-60">
                  Obat yang Akan Di-Opname
                  {!isLoadingProducts && (
                    <span className="ml-1 text-primary">({scheduleProducts.length} obat)</span>
                  )}
                </label>
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="material-icons-round text-primary text-xl animate-spin">
                      refresh
                    </span>
                    <span className="text-xs text-text-secondary-light ml-2">Memuat obat...</span>
                  </div>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800 p-2 space-y-0.5">
                    {scheduleProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-background-light dark:bg-background-dark text-sm"
                      >
                        <span className="font-bold truncate flex-1">{p.name}</span>
                      </div>
                    ))}
                    {scheduleProducts.length === 0 && (
                      <p className="text-center text-sm text-text-secondary-light py-4 italic">
                        Tidak ada obat pada jadwal ini.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 pb-6 pt-2 gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowManualModal(false)}
              className="font-bold rounded-xl px-4 h-auto py-2.5"
            >
              Batal
            </Button>
            <Button
              onClick={handleCreateManualOpname}
              disabled={
                !selectedScheduleId || !manualDate || scheduleProducts.length === 0 || isCreating
              }
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-auto py-2.5 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <span className="material-icons-round text-sm mr-1.5 animate-spin">refresh</span>
                  Membuat...
                </>
              ) : (
                <>
                  <span className="material-icons-round text-sm mr-1.5">bolt</span>
                  Buat Opname
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Hapus Opname?"
        message="Yakin ingin menghapus opname ini beserta semua detailnya? Tindakan ini tidak dapat dibatalkan."
        type="danger"
        confirmText="Ya, Hapus"
        onConfirm={doDeleteOpname}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '' })}
      />
    </div>
  );
};

export default RiwayatOpnamePage;
