export type ViewType =
  | 'dashboard'
  | 'master-data-produk'
  | 'master-data-jasa'
  | 'stok-masuk'
  | 'stok-keluar'
  | 'stok-opname'
  | 'laporan-stok';

// Route paths for React Router
export const ROUTES = {
  DASHBOARD: '/',
  MASTER_DATA_PRODUK: '/master-data/produk',
  MASTER_DATA_JASA: '/master-data/jasa',
  STOK_MASUK: '/transaksi/stok-masuk',
  STOK_KELUAR: '/transaksi/stok-keluar',
  STOK_OPNAME: '/audit/stok-opname',
  RIWAYAT_OPNAME: '/audit/stok-opname/riwayat',
  KONFIGURASI_OPNAME: '/audit/stok-opname/konfigurasi',
  PELAKSANAAN_OPNAME: '/audit/stok-opname/pelaksanaan/:opnameId',
  DETAIL_OPNAME: '/audit/stok-opname/detail/:opnameId',
  LAPORAN_STOK: '/laporan/stok',
  USER_MANAGEMENT: '/pengaturan/user-management',
  PROFIL: '/pengaturan/profil',
  NOTIFICATIONS: '/notifikasi',
} as const;
