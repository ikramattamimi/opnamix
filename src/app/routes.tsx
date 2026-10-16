/* eslint-disable react-refresh/only-export-components -- file konfigurasi, bukan modul komponen */
import React from 'react';
import {
  Archive,
  BriefcaseMedical,
  Bell,
  ChartColumn,
  CircleArrowDown,
  CircleArrowUp,
  ClipboardCheck,
  History,
  LayoutDashboard,
  Settings,
  User,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/types/routes';
import type { AppRole } from '@/features/users/types';

// Satu-satunya sumber untuk path, judul, role, menu sidebar, dan halaman lazy.
// Menambah halaman cukup dengan menambah satu entri di APP_ROUTES.

type PageComponent = React.LazyExoticComponent<React.ComponentType>;

export interface SidebarConfig {
  label: string;
  icon: LucideIcon;
  // Judul grup di atas item. Item tanpa group tidak memunculkan judul baru.
  group?: string;
  // Item yang punya parent dikelompokkan dalam menu yang bisa dibuka-tutup.
  parent?: SidebarParent;
}

export interface SidebarParent {
  label: string;
  icon: LucideIcon;
  // Parent ditandai aktif kalau pathname diawali prefix ini
  pathPrefix: string;
}

export interface AppRoute {
  path: string;
  title: string;
  // Kosong berarti semua user yang sudah login boleh masuk
  roles?: readonly AppRole[];
  element: PageComponent;
  // Nama yang ditampilkan ErrorBoundary kalau halaman gagal render
  errorName: string;
  showInSidebar: boolean;
  sidebar?: SidebarConfig;
}

const Dashboard = React.lazy(() => import('@/features/dashboard/Dashboard'));
const ProductManagement = React.lazy(() => import('@/features/products/ProductManagement'));
const ServiceManagement = React.lazy(() => import('@/features/services/ServiceManagement'));
const StockInManagement = React.lazy(() => import('@/features/stock-in/StockInManagement'));
const StockOutManagement = React.lazy(() => import('@/features/stock-out/StockOutManagement'));
const RiwayatOpnamePage = React.lazy(() => import('@/features/opname/RiwayatOpnamePage'));
const KonfigurasiOpnamePage = React.lazy(() => import('@/features/opname/KonfigurasiOpnamePage'));
const PelaksanaanOpnamePage = React.lazy(() => import('@/features/opname/PelaksanaanOpnamePage'));
const DetailOpnamePage = React.lazy(() => import('@/features/opname/DetailOpnamePage'));
const StockReport = React.lazy(() => import('@/features/reports/StockReport'));
const UserManagement = React.lazy(() => import('@/features/users/UserManagement'));
const ProfilePage = React.lazy(() => import('@/features/profile/ProfilePage'));
const NotificationsPage = React.lazy(() => import('@/features/notifications/NotificationsPage'));

// Role staf yang boleh mengelola master data, stok masuk, opname, dan laporan
export const STAFF_ROLES: readonly AppRole[] = ['admin', 'farmasi', 'apoteker'];

const OPNAME_PARENT: SidebarParent = {
  label: 'Stok Opname',
  icon: ClipboardCheck,
  pathPrefix: ROUTES.STOK_OPNAME,
};

// Urutan entri = urutan menu di sidebar
export const APP_ROUTES: readonly AppRoute[] = [
  {
    path: ROUTES.DASHBOARD,
    title: 'Dasbor Utama',
    element: Dashboard,
    errorName: 'Dashboard',
    showInSidebar: true,
    sidebar: { label: 'Dashboard', icon: LayoutDashboard },
  },
  {
    path: ROUTES.MASTER_DATA_PRODUK,
    title: 'Master Data Produk',
    roles: STAFF_ROLES,
    element: ProductManagement,
    errorName: 'Master Data Produk',
    showInSidebar: true,
    sidebar: { label: 'Data Produk', icon: Archive, group: 'Master Data' },
  },
  {
    path: ROUTES.MASTER_DATA_JASA,
    title: 'Master Data Jasa',
    roles: STAFF_ROLES,
    element: ServiceManagement,
    errorName: 'Master Data Jasa',
    showInSidebar: true,
    sidebar: { label: 'Data Jasa', icon: BriefcaseMedical, group: 'Master Data' },
  },
  {
    path: ROUTES.STOK_MASUK,
    title: 'Penerimaan Stok (Masuk)',
    roles: STAFF_ROLES,
    element: StockInManagement,
    errorName: 'Penerimaan Stok',
    showInSidebar: true,
    sidebar: { label: 'Stok Masuk', icon: CircleArrowDown, group: 'Transaksi' },
  },
  {
    path: ROUTES.STOK_KELUAR,
    title: 'Pengeluaran Stok (Keluar)',
    element: StockOutManagement,
    errorName: 'Pengeluaran Stok',
    showInSidebar: true,
    sidebar: { label: 'Stok Keluar', icon: CircleArrowUp, group: 'Transaksi' },
  },
  {
    path: ROUTES.STOK_OPNAME,
    title: 'Audit Stok (Opname)',
    roles: STAFF_ROLES,
    element: RiwayatOpnamePage,
    errorName: 'Riwayat Opname',
    showInSidebar: false,
  },
  {
    path: ROUTES.RIWAYAT_OPNAME,
    title: 'Riwayat Opname',
    roles: STAFF_ROLES,
    element: RiwayatOpnamePage,
    errorName: 'Riwayat Opname',
    showInSidebar: true,
    sidebar: {
      label: 'Riwayat Opname',
      icon: History,
      group: 'Audit & Kontrol',
      parent: OPNAME_PARENT,
    },
  },
  {
    path: ROUTES.KONFIGURASI_OPNAME,
    title: 'Konfigurasi Opname',
    roles: STAFF_ROLES,
    element: KonfigurasiOpnamePage,
    errorName: 'Konfigurasi Opname',
    showInSidebar: true,
    sidebar: {
      label: 'Konfigurasi Opname',
      icon: Settings,
      group: 'Audit & Kontrol',
      parent: OPNAME_PARENT,
    },
  },
  {
    path: ROUTES.PELAKSANAAN_OPNAME,
    title: 'Pelaksanaan Opname',
    roles: STAFF_ROLES,
    element: PelaksanaanOpnamePage,
    errorName: 'Pelaksanaan Opname',
    showInSidebar: false,
  },
  {
    path: ROUTES.DETAIL_OPNAME,
    title: 'Detail Opname',
    roles: STAFF_ROLES,
    element: DetailOpnamePage,
    errorName: 'Detail Opname',
    showInSidebar: false,
  },
  {
    path: ROUTES.NOTIFICATIONS,
    title: 'Notifikasi',
    element: NotificationsPage,
    errorName: 'Notifikasi',
    showInSidebar: true,
    sidebar: { label: 'Notifikasi', icon: Bell },
  },
  {
    path: ROUTES.LAPORAN_STOK,
    title: 'Analisis & Laporan Stok',
    roles: STAFF_ROLES,
    element: StockReport,
    errorName: 'Laporan Stok',
    showInSidebar: true,
    sidebar: { label: 'Laporan Stok', icon: ChartColumn, group: 'Laporan' },
  },
  {
    path: ROUTES.USER_MANAGEMENT,
    title: 'Manajemen Pengguna',
    roles: ['admin'],
    element: UserManagement,
    errorName: 'Manajemen Pengguna',
    showInSidebar: true,
    sidebar: { label: 'Kelola Pengguna', icon: UserCog },
  },
  {
    path: ROUTES.PROFIL,
    title: 'Profil Saya',
    element: ProfilePage,
    errorName: 'Profil',
    showInSidebar: true,
    sidebar: { label: 'Profil', icon: User },
  },
];
