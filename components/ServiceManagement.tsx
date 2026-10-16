import React, { useState } from 'react';
import { Service } from '../types';
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from '../hooks/useServices';
import { useCreateServiceCategory, useServiceCategories } from '../hooks/useServiceCategories';
import StatCard from './StatCard';
import PaginationControls from './PaginationControls';
import ConfirmationModal from './ConfirmationModal';
import { Button } from './ui/button';
import { DataTable } from './ui/data-table';
import { createServiceColumns } from './ServiceColumns';
import { useToast } from './ui/toast';
import { exportServicesToExcel } from '../lib/exportUtils';
import { sanitizePriceInput } from '../lib/utils';

interface ValidationErrors {
  name?: string;
  price?: string;
  categoryId?: string;
}

const generateServiceCode = (name?: string) => {
  const normalizedName =
    (name || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 4) || 'SRV';
  const timestamp = Date.now().toString().slice(-6);
  return `${normalizedName}-${timestamp}`;
};

const generateCategoryCodePreview = (name?: string) =>
  (name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 20) || 'KATEGORI';

const ServiceManagement: React.FC = () => {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data: paginatedData, isPlaceholderData } = useServices({ page, perPage });
  const services = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 1;
  const totalServices = paginatedData?.total || 0;

  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const createServiceCategory = useCreateServiceCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Validation State
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; serviceId: string | null }>(
    {
      isOpen: false,
      serviceId: null,
    },
  );

  // Category/Subcategory State
  const { data: categories = [] } = useServiceCategories();
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    code: '',
    categoryId: '',
    price: undefined,
    description: '',
  });

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Nama jasa minimal 3 karakter';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Harga harus lebih dari 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
    validateForm();
  };

  const handleOpenModal = (service?: Service) => {
    setErrors({});
    setTouched(new Set());

    if (service) {
      setEditingId(service.id);
      setFormData({
        name: service.name,
        code: service.code,
        categoryId: service.categoryId,
        price: service.price,
        description: service.description || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        code: '',
        categoryId: '',
        price: undefined,
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched(new Set(['name', 'price']));
    if (!validateForm()) return;

    const payload: Partial<Service> = {
      ...formData,
      code: formData.code?.trim() || generateServiceCode(formData.name),
    };

    try {
      if (editingId) {
        await updateService.mutateAsync({ id: editingId, updates: payload });
      } else {
        await createService.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving service:', error);
      showToast('Gagal menyimpan jasa', 'error');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, serviceId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.serviceId) {
      try {
        await deleteService.mutateAsync(deleteConfirm.serviceId);
        setDeleteConfirm({ isOpen: false, serviceId: null });
      } catch (error) {
        console.error('Error deleting service:', error);
        showToast('Gagal menghapus jasa', 'error');
      }
    }
  };

  const getInputClassName = (fieldName: string, baseClassName: string) => {
    const hasError = touched.has(fieldName) && errors[fieldName as keyof ValidationErrors];
    return `${baseClassName} ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;
  };

  const openCategoryModal = () => {
    setCategoryName('');
    setCategoryDescription('');
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      setCategoryError('Nama kategori wajib diisi.');
      return;
    }

    try {
      const createdCategory = await createServiceCategory.mutateAsync({
        name: categoryName.trim(),
        description: categoryDescription.trim(),
      });

      setFormData((prev) => ({
        ...prev,
        categoryId: createdCategory.id,
      }));
      setIsCategoryModalOpen(false);
      setCategoryError('');
      showToast(`Kategori "${createdCategory.name}" berhasil ditambahkan.`, 'success');
    } catch (error: any) {
      console.error('Error creating category:', error);
      setCategoryError(error?.message || 'Gagal menambah kategori.');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Jasa"
            value={totalServices.toString()}
            icon="medical_services"
            color="primary"
          />
          <StatCard
            label="Harga Rata-rata"
            value={
              services.length > 0
                ? `Rp ${Math.round(services.reduce((acc, s) => acc + (s.price || 0), 0) / services.length).toLocaleString('id-ID')}`
                : '-'
            }
            icon="attach_money"
            color="orange-500"
          />
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-white">Daftar Jasa</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="shadow-md flex items-center gap-2"
              onClick={openCategoryModal}
            >
              <span className="material-icons-round">playlist_add</span>
              Tambah Kategori
            </Button>
            <Button
              variant="outline"
              className="shadow-md flex items-center gap-2"
              onClick={() => void exportServicesToExcel(services)}
              disabled={services.length === 0}
            >
              <span className="material-icons-round">file_download</span>
              Ekspor Excel
            </Button>
            <Button onClick={() => handleOpenModal()} className="shadow-md flex items-center gap-2">
              <span className="material-icons-round">add</span>
              Tambah Jasa Baru
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full">
          <div className="bg-card-light dark:bg-card-dark rounded-[20px] p-6 shadow-soft h-full">
            <DataTable
              columns={createServiceColumns({
                onEdit: handleOpenModal,
                onDelete: handleDeleteClick,
              })}
              data={services}
              searchable={false}
            />
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              isPlaceholderData={isPlaceholderData}
            />
          </div>
        </div>
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm m-0">
          <div className="bg-white dark:bg-card-dark w-full max-w-2xl rounded-[32px] shadow-soft p-8 overflow-y-auto max-h-[90vh] relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-text-primary-light dark:text-white">
                {editingId ? 'Edit Jasa' : 'Tambah Jasa Baru'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-background-light dark:bg-white/5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <span className="material-icons-round">close</span>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">
                  Nama Jasa <span className="text-red-500">*</span>
                </label>
                <input
                  className={getInputClassName(
                    'name',
                    'w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark text-text-primary-light dark:text-white px-4 py-3 text-sm focus:border-primary focus:ring-primary',
                  )}
                  placeholder="contoh: Konsultasi Umum"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={() => handleBlur('name')}
                />
                {touched.has('name') && errors.name && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <span className="material-icons-round text-sm">error</span>
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  className={getInputClassName(
                    'categoryId',
                    'w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark text-text-primary-light dark:text-white px-4 py-3 text-sm focus:border-primary focus:ring-primary',
                  )}
                  value={formData.categoryId}
                  onChange={(e) => {
                    const newCategoryId = e.target.value;
                    setFormData({ ...formData, categoryId: newCategoryId });
                  }}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openCategoryModal}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80"
                >
                  <span className="material-icons-round text-sm">add</span>
                  Tambah kategori baru
                </button>
                {touched.has('categoryId') && errors.categoryId && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <span className="material-icons-round text-sm">error</span>
                    {errors.categoryId}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">
                  Harga (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-text-secondary-light text-sm">
                    Rp
                  </span>
                  <input
                    className={getInputClassName(
                      'price',
                      'w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark text-text-primary-light dark:text-white pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-primary',
                    )}
                    placeholder="150000"
                    type="number"
                    min="0"
                    value={formData.price ?? ''}
                    onChange={(e) => {
                      const sanitized = sanitizePriceInput(e.target.value);
                      setFormData({
                        ...formData,
                        price: sanitized === '' ? undefined : Number(sanitized),
                      });
                    }}
                    onBlur={() => handleBlur('price')}
                  />
                </div>
                {touched.has('price') && errors.price && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <span className="material-icons-round text-sm">error</span>
                    {errors.price}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">
                  Deskripsi
                </label>
                <textarea
                  className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark text-text-primary-light dark:text-white px-4 py-3 text-sm focus:border-primary focus:ring-primary resize-none"
                  placeholder="Deskripsi singkat layanan..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold shadow-lg"
                  disabled={createService.isPending || updateService.isPending}
                >
                  {createService.isPending || updateService.isPending ? (
                    <>
                      <span className="material-icons-round text-[18px] animate-spin mr-1">
                        refresh
                      </span>
                      Menyimpan...
                    </>
                  ) : editingId ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Data Jasa'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-[28px] shadow-soft p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-lg font-bold text-text-primary-light dark:text-white">
                  Tambah Kategori Jasa
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Kategori baru akan langsung tersedia di form jasa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 rounded-full bg-background-light dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value);
                    if (categoryError) {
                      setCategoryError('');
                    }
                  }}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark px-4 py-3 text-sm text-text-primary-light dark:text-white focus:border-primary focus:ring-primary"
                  placeholder="Contoh: Rawat Jalan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">
                  Deskripsi
                </label>
                <textarea
                  rows={3}
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark px-4 py-3 text-sm text-text-primary-light dark:text-white focus:border-primary focus:ring-primary resize-none"
                  placeholder="Opsional"
                />
              </div>

              <div className="rounded-xl bg-background-light dark:bg-background-dark px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Kode Otomatis
                </p>
                <p className="text-sm font-bold text-text-primary-light dark:text-white">
                  {generateCategoryCodePreview(categoryName)}
                </p>
              </div>

              {categoryError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {categoryError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryModalOpen(false)}
                  disabled={createServiceCategory.isPending}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={createServiceCategory.isPending}>
                  {createServiceCategory.isPending ? 'Menyimpan...' : 'Simpan Kategori'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Hapus Jasa?"
        message="Apakah Anda yakin ingin menghapus jasa ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, serviceId: null })}
      />
    </>
  );
};

export default ServiceManagement;
