import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ROUTES } from './types';
import LoginPage from './components/LoginPage';
import { ToastProvider } from './components/ui/toast';
import { NotificationProvider } from './components/NotificationProvider';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { UserProfile } from './lib/auth';

const AuthenticatedApp = React.lazy(() => import('./components/AuthenticatedApp'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
    <div className="text-center">
      <span className="material-icons-round text-primary text-6xl animate-spin">refresh</span>
      <p className="mt-4 text-text-secondary-light">Memuat...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AppContentWrapper />
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const AppContentWrapper: React.FC = () => {
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const getViewTitle = (pathname: string) => {
    if (pathname.startsWith(ROUTES.RIWAYAT_OPNAME)) return 'Riwayat Opname';
    if (pathname.startsWith('/audit/stok-opname/konfigurasi')) return 'Konfigurasi Opname';
    if (pathname.startsWith('/audit/stok-opname/pelaksanaan')) return 'Pelaksanaan Opname';
    if (pathname.startsWith('/audit/stok-opname/detail')) return 'Detail Opname';
    switch (pathname) {
      case ROUTES.DASHBOARD:
        return 'Dasbor Utama';
      case ROUTES.MASTER_DATA_PRODUK:
        return 'Master Data Produk';
      case ROUTES.MASTER_DATA_JASA:
        return 'Master Data Jasa';
      case ROUTES.STOK_MASUK:
        return 'Penerimaan Stok (Masuk)';
      case ROUTES.STOK_KELUAR:
        return 'Pengeluaran Stok (Keluar)';
      case ROUTES.STOK_OPNAME:
        return 'Audit Stok (Opname)';
      case ROUTES.LAPORAN_STOK:
        return 'Analisis & Laporan Stok';
      case ROUTES.USER_MANAGEMENT:
        return 'Manajemen Pengguna';
      case ROUTES.PROFIL:
        return 'Profil Saya';
      case ROUTES.NOTIFICATIONS:
        return 'Notifikasi';
      default:
        return 'Opnamix';
    }
  };

  if (isAuthLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <NotificationProvider>
      <Suspense fallback={<LoadingScreen />}>
        <AuthenticatedApp
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          userProfile={userProfile as UserProfile | null}
          getViewTitle={getViewTitle}
        />
      </Suspense>
    </NotificationProvider>
  );
};

export default App;
