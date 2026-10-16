import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/features/auth/LoginPage';
import { ToastProvider } from '@/components/ui/toast';
import { NotificationProvider } from '@/features/notifications/NotificationProvider';
import { AuthProvider, useAuth } from '@/features/auth/useAuth';
import { UserProfile } from '@/features/auth/api';

const AuthenticatedApp = React.lazy(() => import('./AuthenticatedApp'));

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
        />
      </Suspense>
    </NotificationProvider>
  );
};

export default App;
