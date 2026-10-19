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
  Component,
  LayoutDashboard,
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
  // Angka di samping menu, diisi oleh useSidebarBadges
  badge?: SidebarBadge;
}

export type SidebarBadge = 'notifications';

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
const StockInPos = React.lazy(() => import('@/features/stock-in/StockInPos'));
const StockOutManagement = React.lazy(() => import('@/features/stock-out/StockOutManagement'));
const StockOutPos = React.lazy(() => import('@/features/stock-out/StockOutPos'));
const StokOpnamePage = React.lazy(() => import('@/features/opname/StokOpnamePage'));
const OpnameRunPage = React.lazy(() => import('@/features/opname/OpnameRunPage'));
const OpnameReportPage = React.lazy(() => import('@/features/opname/OpnameReportPage'));
const OpnameRedirect = React.lazy(() => import('@/features/opname/OpnameRedirect'));
const StockReport = React.lazy(() => import('@/features/reports/StockReport'));
const UserManagement = React.lazy(() => import('@/features/users/UserManagement'));
const ProfilePage = React.lazy(() => import('@/features/profile/ProfilePage'));
const NotificationsPage = React.lazy(() => import('@/features/notifications/NotificationsPage'));
const UiDocsPage = React.lazy(() => import('@/features/ui-docs/UiDocsPage'));

// Role staf yang boleh mengelola master data, stok masuk, opname, dan laporan
export const STAFF_ROLES: readonly AppRole[] = ['admin', 'farmasi', 'apoteker'];

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
    path: ROUTES.STOK_MASUK_BARU,
    title: 'Terima barang',
    roles: STAFF_ROLES,
    element: StockInPos,
    errorName: 'Terima barang',
    showInSidebar: false,
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
    // Judul diganti halaman sesuai mode (permintaan/manual/edit)
    path: ROUTES.STOK_KELUAR_BARU,
    title: 'Permintaan baru',
    element: StockOutPos,
    errorName: 'Stok Keluar baru',
    showInSidebar: false,
  },
  {
    path: ROUTES.STOK_OPNAME,
    title: 'Stok Opname',
    roles: STAFF_ROLES,
    element: StokOpnamePage,
    errorName: 'Stok Opname',
    showInSidebar: true,
    sidebar: { label: 'Stok Opname', icon: ClipboardCheck, group: 'Audit & Kontrol' },
  },
  {
    // Judul diganti nama sesi oleh halaman
    path: ROUTES.OPNAME_HITUNG,
    title: 'Hitung opname',
    roles: STAFF_ROLES,
    element: OpnameRunPage,
    errorName: 'Layar kerja opname',
    showInSidebar: false,
  },
  {
    path: ROUTES.OPNAME_LAPORAN,
    title: 'Laporan opname',
    roles: STAFF_ROLES,
    element: OpnameReportPage,
    errorName: 'Laporan opname',
    showInSidebar: false,
  },
  // Rute lama, dialihkan ke halaman baru
  ...[
    ROUTES.RIWAYAT_OPNAME,
    ROUTES.KONFIGURASI_OPNAME,
    ROUTES.PELAKSANAAN_OPNAME,
    ROUTES.DETAIL_OPNAME,
  ].map((path) => ({
    path,
    title: 'Stok Opname',
    roles: STAFF_ROLES,
    element: OpnameRedirect,
    errorName: 'Stok Opname',
    showInSidebar: false,
  })),
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
    path: ROUTES.NOTIFICATIONS,
    title: 'Notifikasi',
    element: NotificationsPage,
    errorName: 'Notifikasi',
    showInSidebar: true,
    sidebar: { label: 'Notifikasi', icon: Bell, group: 'Lainnya', badge: 'notifications' },
  },
  {
    path: ROUTES.USER_MANAGEMENT,
    title: 'Manajemen Pengguna',
    roles: ['admin'],
    element: UserManagement,
    errorName: 'Manajemen Pengguna',
    showInSidebar: true,
    sidebar: { label: 'Kelola Pengguna', icon: UserCog, group: 'Lainnya' },
  },
  {
    // Dokumentasi pengembang, jadi hanya untuk admin
    path: ROUTES.UI_DOCS,
    title: 'Dokumentasi Komponen UI',
    roles: ['admin'],
    element: UiDocsPage,
    errorName: 'Dokumentasi Komponen UI',
    showInSidebar: true,
    sidebar: { label: 'Komponen UI', icon: Component, group: 'Lainnya' },
  },
  {
    path: ROUTES.PROFIL,
    title: 'Profil Saya',
    element: ProfilePage,
    errorName: 'Profil',
    // Dibuka dari kartu pengguna di bawah sidebar
    showInSidebar: false,
  },
];
