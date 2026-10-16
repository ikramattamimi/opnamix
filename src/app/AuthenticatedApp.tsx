import React, { Suspense, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ROUTES } from '@/types/routes';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { UserProfile } from '@/features/auth/api';
import { useActiveOpnameLock, useOpnameLockRealtime } from '@/features/opname/useActiveOpnameLock';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';

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
const OpnameLockPage = React.lazy(() => import('@/features/opname/OpnameLockPage'));
const NotificationsPage = React.lazy(() => import('@/features/notifications/NotificationsPage'));

interface AuthenticatedAppProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  userProfile: UserProfile | null;
  getViewTitle: (pathname: string) => string;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full w-full min-h-[400px]">
    <div className="text-center">
      <span className="material-icons-round text-primary text-4xl animate-spin">refresh</span>
      <p className="mt-2 text-sm text-text-secondary-light">Memuat modul...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{
  allowedRoles: string[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { userProfile } = useAuth();
  const userRoles = userProfile?.roles ?? (userProfile?.role ? [userProfile.role] : []);

  if (userRoles.length === 0 || !allowedRoles.some((r) => userRoles.includes(r))) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return <>{children}</>;
};

const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <span className="material-icons-round text-6xl text-gray-300 dark:text-gray-600 mb-4">
      search_off
    </span>
    <h2 className="text-2xl font-bold text-text-primary-light dark:text-white mb-2">
      Halaman Tidak Ditemukan
    </h2>
    <p className="text-text-secondary-light mb-6">Halaman yang Anda cari tidak tersedia.</p>
    <Button onClick={() => (window.location.href = '/')}>Kembali ke Dashboard</Button>
  </div>
);

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({
  isDarkMode,
  setIsDarkMode,
  userProfile,
  getViewTitle,
}) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: lock, isLoading } = useActiveOpnameLock();
  useOpnameLockRealtime();
  const isLocked = lock?.isLocked ?? false;
  const opname = lock?.opname ?? null;

  const userRoles = userProfile?.roles ?? (userProfile?.role ? [userProfile.role] : []);
  const isOpnameRoute = location.pathname.startsWith('/audit/stok-opname');
  const canAccessOpname = userRoles.some((r) => ['admin', 'apoteker', 'farmasi'].includes(r));

  if (isLocked && opname && !isLoading) {
    if (!(isOpnameRoute && canAccessOpname)) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <OpnameLockPage opname={opname} />
        </Suspense>
      );
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-300 font-body">
      <Sidebar isMobileOpen={isSidebarOpen} onCloseMobile={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          viewName={getViewTitle(location.pathname)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="p-6 md:p-8">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route
                path={ROUTES.DASHBOARD}
                element={
                  <ErrorBoundary name="Dashboard">
                    <Dashboard />
                  </ErrorBoundary>
                }
              />

              <Route
                path={ROUTES.MASTER_DATA_PRODUK}
                element={
                  <ProtectedRoute allowedRoles={['admin', 'farmasi']}>
                    <ErrorBoundary name="Master Data Produk">
                      <ProductManagement />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              <Route
                path={ROUTES.MASTER_DATA_JASA}
                element={
                  <ProtectedRoute allowedRoles={['admin', 'farmasi']}>
                    <ErrorBoundary name="Master Data Jasa">
                      <ServiceManagement />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              <Route
                path={ROUTES.STOK_MASUK}
                element={
                  <ProtectedRoute allowedRoles={['admin', 'farmasi']}>
                    <ErrorBoundary name="Penerimaan Stok">
                      <StockInManagement />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              <Route
                path={ROUTES.STOK_KELUAR}
                element={
                  <ErrorBoundary name="Pengeluaran Stok">
                    <StockOutManagement />
                  </ErrorBoundary>
                }
              />

              <Route
                path={ROUTES.STOK_OPNAME}
                element={
                  <ProtectedRoute allowedRoles={['admin', 'farmasi']}>
                    <ErrorBoundary name="Riwayat Opname">
                      <RiwayatOpnamePage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.RIWAYAT_OPNAME}
                element={
                  <ProtectedRoute allowedRoles={['admin', 'farmasi']}>
                    <ErrorBoundary name="Riwayat Opname">
                      <RiwayatOpnamePage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.KONFIGURASI_OPNAME}
                element={
                  <ProtectedRoute allowedRoles={['admin', 'farmasi']}>
                    <ErrorBoundary name="Konfigurasi Opname">
                      <KonfigurasiOpnamePage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.PELAKSANAAN_OPNAME}
                element={
                  <ProtectedRoute allowedRoles={['admin', 'farmasi']}>
                    <ErrorBoundary name="Pelaksanaan Opname">
                      <PelaksanaanOpnamePage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.DETAIL_OPNAME}
                element={
                  <ProtectedRoute allowedRoles={['admin', 'farmasi']}>
                    <ErrorBoundary name="Detail Opname">
                      <DetailOpnamePage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              <Route
                path={ROUTES.LAPORAN_STOK}
                element={
                  <ProtectedRoute allowedRoles={['admin', 'farmasi']}>
                    <ErrorBoundary name="Laporan Stok">
                      <StockReport />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              <Route
                path={ROUTES.USER_MANAGEMENT}
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ErrorBoundary name="Manajemen Pengguna">
                      <UserManagement />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              <Route
                path={ROUTES.PROFIL}
                element={
                  <ErrorBoundary name="Profil">
                    <ProfilePage />
                  </ErrorBoundary>
                }
              />

              <Route
                path={ROUTES.NOTIFICATIONS}
                element={
                  <ErrorBoundary name="Notifikasi">
                    <NotificationsPage />
                  </ErrorBoundary>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </div>

        <footer className="mt-auto py-6 px-8 text-sm text-text-secondary-light flex flex-col md:flex-row justify-between items-center bg-transparent">
          <p>© {new Date().getFullYear()} Opnamix. Hak Cipta Dilindungi.</p>
        </footer>
      </main>
    </div>
  );
};

export default AuthenticatedApp;
