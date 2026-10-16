import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { OpnameSchedule, OpnameScheduleConfig, PengulanganOpname, Product } from '../../types';
import { Button } from '../ui/button';
import ConfirmationModal from '../ConfirmationModal';
import { useToast } from '../ui/toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../ui/dialog';

const KonfigurasiOpnamePage: React.FC = () => {
    const { showToast } = useToast();
    const [schedules, setSchedules] = useState<OpnameSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [modalStep, setModalStep] = useState<1 | 2>(1); // 1 = info jadwal, 2 = pilih obat
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [selectedObatIds, setSelectedObatIds] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(true); // true = semua obat
    const [searchProduct, setSearchProduct] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
    const [formData, setFormData] = useState<OpnameScheduleConfig>({
        nama: '',
        pengulangan: 'BULANAN',
        dayOfMonth: 28,
        waktuJam: 10,
        waktuMenit: 0,
        durasiPengerjaan: 7,
        obatIds: null,
    });

    useEffect(() => {
        loadSchedules();
        loadProducts();
    }, []);

    const loadSchedules = async () => {
        try {
            const data = await api.getOpnameSchedules();
            setSchedules(data);
        } catch (error) {
            console.error('Failed to load schedules:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const result = await api.getProducts({ page: 1, perPage: 1000 });
            setAllProducts(result.data);
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            nama: '',
            pengulangan: 'BULANAN',
            dayOfMonth: 28,
            waktuJam: 10,
            waktuMenit: 0,
            durasiPengerjaan: 7,
            obatIds: null,
        });
        setEditingId(null);
        setModalStep(1);
        setSelectAll(true);
        setSelectedObatIds(new Set());
        setSearchProduct('');
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (schedule: OpnameSchedule) => {
        setFormData({
            nama: schedule.nama,
            pengulangan: schedule.pengulangan,
            dayOfMonth: schedule.tanggalAudit,
            waktuJam: schedule.waktuJam,
            waktuMenit: schedule.waktuMenit,
            durasiPengerjaan: schedule.durasiPengerjaan || 7,
            obatIds: schedule.obatIds,
        });
        setEditingId(schedule.id);
        if (schedule.obatIds === null) {
            setSelectAll(true);
            setSelectedObatIds(new Set());
        } else {
            setSelectAll(false);
            setSelectedObatIds(new Set(schedule.obatIds));
        }
        setModalStep(1);
        setSearchProduct('');
        setShowModal(true);
    };

    const handleSave = async () => {
        const dataToSave = {
            ...formData,
            obatIds: selectAll ? null : Array.from(selectedObatIds),
        };
        setIsSaving(true);
        try {
            if (editingId) {
                await api.updateOpnameSchedule(editingId, dataToSave);
            } else {
                await api.createOpnameSchedule(dataToSave);
            }
            setShowModal(false);
            resetForm();
            loadSchedules();
            showToast(editingId ? 'Jadwal berhasil diperbarui!' : 'Jadwal berhasil dibuat!', 'success');
        } catch (error) {
            console.error('Failed to save schedule:', error);
            showToast('Gagal menyimpan jadwal.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteConfirm({ isOpen: true, id });
    };

    const doDelete = async () => {
        const id = deleteConfirm.id;
        setDeleteConfirm({ isOpen: false, id: '' });
        try {
            await api.deleteOpnameSchedule(id);
            loadSchedules();
            showToast('Jadwal berhasil dihapus.', 'success');
        } catch (error) {
            console.error('Failed to delete schedule:', error);
            showToast('Gagal menghapus jadwal.', 'error');
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await api.toggleOpnameScheduleStatus(id, !currentStatus);
            loadSchedules();
        } catch (error) {
            console.error('Failed to toggle schedule:', error);
        }
    };

    const toggleObat = (id: string) => {
        const newSet = new Set(selectedObatIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedObatIds(newSet);
    };

    const toggleAllObat = () => {
        if (selectedObatIds.size === filteredProducts.length) {
            setSelectedObatIds(new Set());
        } else {
            setSelectedObatIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const pengulanganLabel: Record<string, string> = {
        BULANAN: 'Setiap Bulan',
        TRIWULAN: 'Setiap 3 Bulan',
        TAHUNAN: 'Setiap Tahun',
    };

    const filteredProducts = allProducts.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        (p.code || '').toLowerCase().includes(searchProduct.toLowerCase())
    );

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <span className="material-icons-round text-primary text-xl sm:text-2xl">settings</span>
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold">Konfigurasi Jadwal Opname</h2>
                        <p className="text-xs sm:text-sm text-text-secondary-light">Kelola jadwal audit stok berkala.</p>
                    </div>
                </div>
                <Button
                    onClick={openAddModal}
                    className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-5 h-auto py-3 sm:py-2.5 shadow-lg shadow-primary/20 w-full sm:w-auto"
                >
                    <span className="material-icons-round text-sm mr-1.5">add</span>
                    Tambah Jadwal
                </Button>
            </div>

            {/* Schedule Modal */}
            <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); resetForm(); } }}>
                <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] bg-card-light dark:bg-card-dark rounded-2xl sm:rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
                        <DialogTitle className="text-base sm:text-lg font-bold">
                            {editingId ? 'Edit Jadwal Opname' : 'Tambah Jadwal Baru'}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-text-secondary-light">
                            {modalStep === 1 ? 'Isi informasi jadwal opname.' : 'Pilih obat yang akan di-opname pada jadwal ini.'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Stepper indicator */}
                    <div className="px-4 sm:px-6 flex items-center gap-1 sm:gap-2">
                        <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial justify-center ${modalStep === 1 ? 'bg-primary text-white' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                            {modalStep > 1 ? <span className="material-icons-round text-xs">check</span> : <span>1</span>}
                            <span className="hidden xs:inline sm:inline">Info Jadwal</span>
                            <span className="xs:hidden sm:hidden">Info</span>
                        </div>
                        <div className="w-4 sm:w-6 h-0.5 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
                        <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial justify-center ${modalStep === 2 ? 'bg-primary text-white' : 'bg-background-light dark:bg-background-dark text-text-secondary-light'}`}>
                            <span>2</span>
                            <span className="hidden xs:inline sm:inline">Pilih Obat</span>
                            <span className="xs:hidden sm:hidden">Obat</span>
                        </div>
                    </div>

                    {/* Step 1: Schedule info */}
                    {modalStep === 1 && (
                        <div className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-bold opacity-60">Nama Jadwal</label>
                                <input
                                    type="text"
                                    value={formData.nama || ''}
                                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                    placeholder="Contoh: Jadwal Rutin Bulanan"
                                    className="w-full bg-background-light dark:bg-background-dark border-none rounded-xl px-4 py-3 text-sm font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs sm:text-sm font-bold opacity-60">Frekuensi</label>
                                    <select
                                        value={formData.pengulangan}
                                        onChange={(e) => setFormData({ ...formData, pengulangan: e.target.value as PengulanganOpname })}
                                        className="w-full bg-background-light dark:bg-background-dark border-none rounded-xl px-4 py-3 text-sm font-medium"
                                    >
                                        <option value="BULANAN">Setiap Bulan</option>
                                        <option value="TRIWULAN">Setiap 3 Bulan</option>
                                        <option value="TAHUNAN">Setiap Tahun</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs sm:text-sm font-bold opacity-60">Tanggal Audit (1-28)</label>
                                    <input
                                        type="number"
                                        min="1" max="28"
                                        value={formData.dayOfMonth}
                                        onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-background-light dark:bg-background-dark border-none rounded-xl px-4 py-3 text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select products */}
                    {modalStep === 2 && (
                        <div className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
                            {/* Select all toggle */}
                            <div className="flex items-center justify-between bg-background-light dark:bg-background-dark rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={() => {
                                            setSelectAll(!selectAll);
                                            if (!selectAll) {
                                                setSelectedObatIds(new Set());
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-bold">Semua Obat</span>
                                </div>
                                <span className="text-xs text-text-secondary-light">
                                    {selectAll ? `${allProducts.length} obat` : `${selectedObatIds.size} dipilih`}
                                </span>
                            </div>

                            {/* Search + product list (only when not selecting all) */}
                            {!selectAll && (
                                <>
                                    <div className="relative">
                                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-sm">search</span>
                                        <input
                                            type="text"
                                            value={searchProduct}
                                            onChange={(e) => setSearchProduct(e.target.value)}
                                            placeholder="Cari obat..."
                                            className="w-full bg-background-light dark:bg-background-dark border-none rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium"
                                        />
                                    </div>

                                    {/* Select/deselect filtered */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-text-secondary-light">{filteredProducts.length} obat ditemukan</span>
                                        <button onClick={toggleAllObat} className="text-xs font-bold text-primary hover:text-primary/80">
                                            {selectedObatIds.size === filteredProducts.length ? 'Batalkan Semua' : 'Pilih Semua'}
                                        </button>
                                    </div>

                                    {/* Product list */}
                                    <div className="max-h-[220px] sm:max-h-[280px] overflow-y-auto space-y-1 rounded-xl border border-gray-100 dark:border-gray-800 p-2">
                                        {filteredProducts.map((product) => (
                                            <label
                                                key={product.id}
                                                className="flex items-start sm:items-center gap-3 p-3 sm:p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-white/10"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedObatIds.has(product.id)}
                                                    onChange={() => toggleObat(product.id)}
                                                    className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0 mt-0.5 sm:mt-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{product.name}</p>
                                                    <p className="text-xs text-text-secondary-light">{product.category} · {product.unit} · Stok: {product.stock}</p>
                                                </div>
                                            </label>
                                        ))}
                                        {filteredProducts.length === 0 && (
                                            <p className="text-center text-sm text-text-secondary-light py-4 italic">Tidak ada obat ditemukan.</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <DialogFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 gap-2 sm:gap-3 flex-col sm:flex-row">
                        {modalStep === 2 && (
                            <Button variant="ghost" onClick={() => setModalStep(1)} className="font-bold rounded-xl px-4 h-auto py-3 sm:py-2.5 w-full sm:w-auto sm:mr-auto order-1 sm:order-none">
                                <span className="material-icons-round text-sm mr-1">arrow_back</span>
                                Kembali
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => { setShowModal(false); resetForm(); }} className="font-bold rounded-xl px-4 h-auto py-3 sm:py-2.5 w-full sm:w-auto order-3 sm:order-none">
                            Batal
                        </Button>
                        {modalStep === 1 ? (
                            <Button
                                onClick={() => setModalStep(2)}
                                disabled={!formData.nama?.trim()}
                                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-auto py-3 sm:py-2.5 shadow-lg shadow-primary/20 disabled:opacity-50 w-full sm:w-auto order-2 sm:order-none"
                            >
                                Lanjutkan
                                <span className="material-icons-round text-sm ml-1.5">arrow_forward</span>
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSave}
                                disabled={(!selectAll && selectedObatIds.size === 0) || isSaving}
                                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-auto py-3 sm:py-2.5 shadow-lg shadow-primary/20 disabled:opacity-50 w-full sm:w-auto order-2 sm:order-none"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="material-icons-round text-sm mr-1 animate-spin">refresh</span>
                                        Menyimpan...
                                    </>
                                ) : (
                                    editingId ? 'Simpan Perubahan' : 'Simpan Jadwal'
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table - Desktop */}
            <div className="hidden lg:block bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-100 dark:border-gray-800">
                            <tr className="text-xs uppercase font-bold text-text-secondary-light tracking-wider">
                                <th className="px-4 py-4">Nama Jadwal</th>
                                <th className="px-4 py-4 text-center">Tanggal Audit</th>
                                <th className="px-4 py-4 text-center">Jumlah Obat</th>
                                <th className="px-4 py-4 text-center">Status</th>
                                <th className="px-4 py-4 text-center">Pengulangan</th>
                                <th className="px-4 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {schedules.length > 0 ? (
                                schedules.map((schedule) => (
                                    <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-4 font-bold text-text-primary-light dark:text-white">{schedule.nama}</td>
                                        <td className="px-4 py-4 text-center text-sm">Tanggal {schedule.tanggalAudit}</td>
                                        <td className="px-4 py-4 text-center text-sm">
                                            {schedule.obatIds === null ? (
                                                <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">Semua Obat</span>
                                            ) : (
                                                <span>{Array.isArray(schedule.obatIds) ? schedule.obatIds.length : 0} obat</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => handleToggle(schedule.id, schedule.isActive)}
                                                className={`relative w-10 h-5 rounded-full transition-colors ${schedule.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow`}
                                                    style={{ left: schedule.isActive ? '22px' : '2px' }}
                                                ></div>
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="px-2 py-1 bg-background-light dark:bg-background-dark rounded-lg text-xs font-bold">
                                                {pengulanganLabel[schedule.pengulangan] || schedule.pengulangan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(schedule)}
                                                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-text-secondary-light hover:text-primary"
                                                >
                                                    <span className="material-icons-round text-base">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(schedule.id)}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-text-secondary-light hover:text-red-500"
                                                >
                                                    <span className="material-icons-round text-base">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-secondary-light italic">
                                        Belum ada jadwal opname. Klik "Tambah Jadwal" untuk membuat jadwal baru.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cards - Mobile & Tablet */}
            <div className="lg:hidden space-y-3">
                {schedules.length > 0 ? (
                    schedules.map((schedule) => (
                        <div key={schedule.id} className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-soft">
                            {/* Header with name and toggle */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base truncate mb-1">{schedule.nama}</h3>
                                </div>
                                <button
                                    onClick={() => handleToggle(schedule.id, schedule.isActive)}
                                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${schedule.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow`}
                                        style={{ left: schedule.isActive ? '23px' : '2px' }}
                                    ></div>
                                </button>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary-light mb-3">
                                <span className="flex items-center gap-1">
                                    <span className="material-icons-round text-xs">event</span>
                                    Tanggal {schedule.tanggalAudit}
                                </span>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-background-light dark:bg-background-dark rounded-lg font-bold">
                                    {pengulanganLabel[schedule.pengulangan] || schedule.pengulangan}
                                </span>

                                {/* Drug count badge */}
                                <span>•</span>
                                {schedule.obatIds === null ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold">
                                        <span className="material-icons-round text-xs">inventory_2</span>
                                        Semua Obat
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-background-light dark:bg-background-dark rounded-lg text-xs font-bold">
                                        <span className="material-icons-round text-xs">inventory_2</span>
                                        {Array.isArray(schedule.obatIds) ? schedule.obatIds.length : 0} obat
                                    </span>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => openEditModal(schedule)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors font-bold text-sm active:scale-95"
                                >
                                    <span className="material-icons-round text-base">edit</span>
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(schedule.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-bold text-sm active:scale-95"
                                >
                                    <span className="material-icons-round text-base">delete</span>
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-card-light dark:bg-card-dark rounded-2xl p-8 text-center shadow-soft">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4">
                            <span className="material-icons-round text-3xl text-text-secondary-light">event_busy</span>
                        </div>
                        <p className="text-sm text-text-secondary-light italic">Belum ada jadwal opname.</p>
                        <p className="text-xs text-text-secondary-light mt-1">Klik tombol "Tambah Jadwal" untuk membuat jadwal baru.</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                title="Hapus Jadwal?"
                message="Yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
                type="danger"
                confirmText="Ya, Hapus"
                onConfirm={doDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: '' })}
            />
        </div>
    );
};

export default KonfigurasiOpnamePage;
