import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, OpnameDetail } from '@/lib/api';

interface DetailRow {
  id: string;
  productName: string;
  stokSistem: number | null;
  stokFisik: number | null;
  selisih: number | null;
  stokFinal: number | null;
  alasan: string;
}

const DetailOpnamePage: React.FC = () => {
  const { opnameId } = useParams<{ opnameId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<DetailRow[]>([]);
  const [opnameInfo, setOpnameInfo] = useState<OpnameDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadDetail();
  }, [opnameId]);

  const loadDetail = async () => {
    if (!opnameId) return;
    try {
      const [detailData, opnameData] = await Promise.all([
        api.getOpnameDetailView(opnameId),
        api.getOpnameById(opnameId),
      ]);
      setDetails(detailData);
      setOpnameInfo(opnameData);
    } catch (error) {
      console.error('Failed to load opname detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { dateStyle: 'long' });
  };

  const filteredDetails = useMemo(() => {
    if (!search.trim()) return details;
    const q = search.toLowerCase();
    return details.filter((d) => d.productName.toLowerCase().includes(q));
  }, [details, search]);

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

  const totalItems = details.length;
  const discrepancies = details.filter((d) => d.selisih !== 0).length;
  const matched = totalItems - discrepancies;

  return (
    <div className="space-y-6 mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/audit/stok-opname/riwayat')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors bg-card-light dark:bg-card-dark shadow-soft"
        >
          <span className="material-icons-round text-text-secondary-light">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-bold">Detail Opname</h2>
          <p className="text-sm text-text-secondary-light">{opnameInfo?.opnameNumber || ''}</p>
        </div>
        <span className="ml-auto text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-xl flex items-center gap-1">
          <span className="material-icons-round text-xs">check_circle</span>
          Selesai
        </span>
      </div>

      {/* 2-Column Layout: 30% Left / 70% Right */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Info (30%) */}
        <div className="lg:w-[30%] space-y-4">
          {/* Informasi Opname */}
          <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft sticky top-6">
            <h3 className="text-base font-bold mb-5 flex items-center gap-2">
              <span className="material-icons-round text-primary text-lg">info</span>
              Informasi Opname
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-text-secondary-light uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="material-icons-round text-primary text-sm">tag</span>
                  Kode Opname
                </p>
                <p className="font-bold text-sm">{opnameInfo?.opnameNumber || '-'}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-text-secondary-light uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="material-icons-round text-indigo-500 text-sm">bookmark</span>
                  Referensi Jadwal
                </p>
                <p className="font-bold text-sm">{opnameInfo?.scheduleName || '-'}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-text-secondary-light uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="material-icons-round text-amber-500 text-sm">event</span>
                  Tanggal Jadwal
                </p>
                <p className="font-bold text-sm">
                  {opnameInfo?.scheduleDate ? formatDate(opnameInfo.scheduleDate) : '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-text-secondary-light uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="material-icons-round text-emerald-500 text-sm">
                    check_circle
                  </span>
                  Tanggal Dilaksanakan
                </p>
                <p className="font-bold text-sm">
                  {opnameInfo?.completedAt ? formatDate(opnameInfo.completedAt) : '-'}
                </p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="border-t border-gray-100 dark:border-gray-800 mt-5 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary-light flex items-center gap-2">
                  <span className="material-icons-round text-primary text-sm">inventory_2</span>
                  Total Item
                </span>
                <span className="text-lg font-bold text-primary">{totalItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary-light flex items-center gap-2">
                  <span className="material-icons-round text-emerald-500 text-sm">verified</span>
                  Sesuai
                </span>
                <span className="text-lg font-bold text-emerald-500">{matched}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary-light flex items-center gap-2">
                  <span className="material-icons-round text-amber-500 text-sm">warning</span>
                  Selisih
                </span>
                <span className="text-lg font-bold text-amber-500">{discrepancies}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Jurnal Penyesuaian (70%) */}
        <div className="lg:w-[70%]">
          <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="material-icons-round text-primary text-xl">table_chart</span>
                Jurnal Penyesuaian
              </h3>
              <div className="relative w-full sm:w-72">
                <span className="material-icons-round text-text-secondary-light text-sm absolute left-3 top-1/2 -translate-y-1/2">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background-light dark:bg-background-dark border-none rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium placeholder:text-text-secondary-light/50 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-100 dark:border-gray-800">
                  <tr className="text-xs uppercase font-bold text-text-secondary-light tracking-wider">
                    <th className="px-4 py-3">Nama Produk</th>
                    <th className="px-4 py-3 text-center">Stok Sistem</th>
                    <th className="px-4 py-3 text-center">Stok Fisik</th>
                    <th className="px-4 py-3 text-center">Selisih</th>
                    <th className="px-4 py-3 text-center">Stok Final</th>
                    <th className="px-4 py-3">Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredDetails.length > 0 ? (
                    filteredDetails.map((row) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${row.selisih !== 0 ? 'bg-amber-500/[0.03]' : ''}`}
                      >
                        <td className="px-4 py-4 font-bold text-sm">{row.productName}</td>
                        <td className="px-4 py-4 text-center text-sm opacity-60">
                          {row.stokSistem}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-primary">
                          {row.stokFisik}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`font-bold px-2 py-1 rounded-full text-xs ${
                              (row.selisih ?? 0) > 0
                                ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                                : (row.selisih ?? 0) < 0
                                  ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                  : 'bg-gray-100 text-text-secondary-light dark:bg-gray-500/20'
                            }`}
                          >
                            {(row.selisih ?? 0) > 0 ? `+${row.selisih}` : row.selisih}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-bold">
                          {row.stokFinal !== null ? row.stokFinal : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm">{row.alasan || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-text-secondary-light"
                      >
                        {search ? 'Tidak ada produk yang cocok.' : 'Tidak ada data.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredDetails.length > 0 ? (
                filteredDetails.map((row) => (
                  <div
                    key={row.id}
                    className={`bg-background-light dark:bg-background-dark rounded-2xl p-4 space-y-3 ${row.selisih !== 0 ? 'ring-2 ring-amber-300/30' : ''}`}
                  >
                    {/* Product Name */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm flex-1">{row.productName}</p>
                      {row.selisih !== 0 && (
                        <span className="material-icons-round text-amber-500 text-sm">warning</span>
                      )}
                    </div>

                    {/* Stats Grid - 4 columns */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-card-light dark:bg-card-dark rounded-xl p-3 text-center">
                        <p className="text-[10px] font-bold text-text-secondary-light uppercase mb-1">
                          Sistem
                        </p>
                        <p className="text-base font-bold opacity-60">{row.stokSistem}</p>
                      </div>
                      <div className="bg-card-light dark:bg-card-dark rounded-xl p-3 text-center">
                        <p className="text-[10px] font-bold text-text-secondary-light uppercase mb-1">
                          Fisik
                        </p>
                        <p className="text-base font-bold text-primary">{row.stokFisik}</p>
                      </div>
                      <div className="bg-card-light dark:bg-card-dark rounded-xl p-3 text-center">
                        <p className="text-[10px] font-bold text-text-secondary-light uppercase mb-1">
                          Selisih
                        </p>
                        <span
                          className={`font-bold text-base ${
                            (row.selisih ?? 0) > 0
                              ? 'text-green-600 dark:text-green-400'
                              : (row.selisih ?? 0) < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-text-secondary-light'
                          }`}
                        >
                          {(row.selisih ?? 0) > 0 ? `+${row.selisih}` : row.selisih}
                        </span>
                      </div>
                      <div className="bg-card-light dark:bg-card-dark rounded-xl p-3 text-center">
                        <p className="text-[10px] font-bold text-text-secondary-light uppercase mb-1">
                          Final
                        </p>
                        <p className="text-base font-bold">
                          {row.stokFinal !== null ? row.stokFinal : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Alasan */}
                    {row.alasan && (
                      <div className="bg-card-light dark:bg-card-dark rounded-xl p-3">
                        <p className="text-[10px] font-bold text-text-secondary-light uppercase mb-1.5 flex items-center gap-1">
                          <span className="material-icons-round text-xs">comment</span>
                          Alasan
                        </p>
                        <p className="text-xs text-text-primary-light dark:text-white leading-relaxed">
                          {row.alasan}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <span className="material-icons-round text-text-secondary-light text-4xl mb-2">
                    inventory_2
                  </span>
                  <p className="text-sm text-text-secondary-light">
                    {search ? 'Tidak ada produk yang cocok.' : 'Tidak ada data.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailOpnamePage;
