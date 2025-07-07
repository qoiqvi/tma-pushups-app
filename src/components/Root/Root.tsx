'use client';

import { type PropsWithChildren } from 'react';
import {
  miniApp,
  useLaunchParams,
  useSignal,
} from '@telegram-apps/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorPage } from '@/components/ErrorPage';
import { TelegramInit } from '@/components/TelegramInit';
import { TelegramAuthProvider } from '@/components/TelegramAuthProvider';
import { ToastProvider } from '@/components/shared/ToastProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
import { useDidMount } from '@/hooks/useDidMount';

import './styles.css';

function RootInner({ children }: PropsWithChildren) {
  const lp = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={
        ['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'
      }
    >
      <ToastProvider>
        {children}
      </ToastProvider>
    </AppRoot>
  );
}

export function Root(props: PropsWithChildren) {
  // Unfortunately, Telegram Mini Apps does not allow us to use all features of
  // the Server Side Rendering. That's why we are showing loader on the server
  // side.
  const didMount = useDidMount();

  return didMount ? (
    <ErrorBoundary fallback={ErrorPage}>
      <TelegramInit>
        <QueryClientProvider client={queryClient}>
          <TelegramAuthProvider>
            <RootInner {...props} />
          </TelegramAuthProvider>
        </QueryClientProvider>
      </TelegramInit>
    </ErrorBoundary>
  ) : (
    <div className="root__loading">Loading</div>
  );
}
