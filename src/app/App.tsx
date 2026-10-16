import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/features/auth/LoginPage';
import { ToastProvider } from '@/components/ui/toast';
import { NotificationProvider } from '@/features/notifications/NotificationProvider';
import { AuthProvider, useAuth } from '@/features/auth/useAuth';
import { UserProfile } from '@/features/auth/api';
import { ThemeProvider } from './providers/ThemeProvider';

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
          <ThemeProvider>
            <ToastProvider>
              <AppContentWrapper />
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const AppContentWrapper: React.FC = () => {
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <NotificationProvider>
      <Suspense fallback={<LoadingScreen />}>
        <AuthenticatedApp userProfile={userProfile as UserProfile | null} />
      </Suspense>
    </NotificationProvider>
  );
};

export default App;
