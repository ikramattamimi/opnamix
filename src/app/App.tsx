import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/features/auth/LoginPage';
import { ToastProvider } from '@/components/ui/toast';
import { NotificationProvider } from '@/features/notifications/NotificationProvider';
import { AuthProvider, useAuth } from '@/features/auth/useAuth';
import { UserProfile } from '@/features/auth/api';
import { LoadingState } from '@/components/common/QueryState';
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
    return <LoadingState fullScreen />;
  }

  if (!user) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <NotificationProvider>
      <Suspense fallback={<LoadingState fullScreen />}>
        <AuthenticatedApp userProfile={userProfile as UserProfile | null} />
      </Suspense>
    </NotificationProvider>
  );
};

export default App;
