import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ROUTES } from '@/types/routes';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/common/QueryState';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { UserProfile } from '@/features/auth/api';
import { useActiveOpnameLock, useOpnameLockRealtime } from '@/features/opname/useActiveOpnameLock';
import { useAuth } from '@/features/auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/QueryState';
import { APP_ROUTES, type AppRoute } from './routes';
import { canAccessRoute, getUserRoles } from './routeUtils';

const OpnameLockPage = React.lazy(() => import('@/features/opname/OpnameLockPage'));

interface AuthenticatedAppProps {
  userProfile: UserProfile | null;
}

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

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Halaman Tidak Ditemukan" />
      <EmptyState
        title="Halaman yang Anda cari tidak tersedia."
        action={<Button onClick={() => navigate(ROUTES.DASHBOARD)}>Kembali ke Dashboard</Button>}
      />
    </>
  );
};

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ userProfile }) => {
  const location = useLocation();
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
        <Suspense fallback={<LoadingState fullScreen />}>
          <OpnameLockPage opname={opname} />
        </Suspense>
      );
    }
  }

  return (
    <AppShell>
      <Suspense fallback={<LoadingState label="Memuat modul..." className="min-h-[400px]" />}>
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
                element={route.roles ? <ProtectedRoute route={route}>{page}</ProtectedRoute> : page}
              />
            );
          })}

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
};

export default AuthenticatedApp;
