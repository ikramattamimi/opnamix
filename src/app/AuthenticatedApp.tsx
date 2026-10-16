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
import { APP_ROUTES, type AppRoute } from './routes';
import { canAccessRoute, getUserRoles } from './routeUtils';

const OpnameLockPage = React.lazy(() => import('@/features/opname/OpnameLockPage'));

interface AuthenticatedAppProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  userProfile: UserProfile | null;
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
  route: AppRoute;
  children: React.ReactNode;
}> = ({ route, children }) => {
  const { userProfile } = useAuth();

  if (!canAccessRoute(route, getUserRoles(userProfile))) {
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
}) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: lock, isLoading } = useActiveOpnameLock();
  useOpnameLockRealtime();
  const isLocked = lock?.isLocked ?? false;
  const opname = lock?.opname ?? null;

  const userRoles = getUserRoles(userProfile);
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
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="p-6 md:p-8">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {APP_ROUTES.map((route) => {
                const Page = route.element;
                const page = (
                  <ErrorBoundary name={route.errorName}>
                    <Page />
                  </ErrorBoundary>
                );
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      route.roles ? <ProtectedRoute route={route}>{page}</ProtectedRoute> : page
                    }
                  />
                );
              })}

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
