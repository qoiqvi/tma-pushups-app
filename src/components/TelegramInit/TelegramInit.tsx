'use client';

import { type PropsWithChildren, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  retrieveLaunchParams,
  miniApp,
  themeParams,
  viewport,
  backButton,
  mainButton,
  init,
} from '@telegram-apps/sdk-react';
import { UserInit } from '@/components/UserInit/UserInit';

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

export function TelegramInit({ children }: PropsWithChildren) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initTelegram = async () => {
      try {
        // Проверяем, что мы в браузере
        if (typeof window === 'undefined') return;
        
        // Получаем параметры запуска
        const lp = retrieveLaunchParams();
        console.log('Launch params:', lp);
        
        // Сохраняем данные Telegram в sessionStorage если они есть в URL
        const hash = window.location.hash;
        if (hash && hash.includes('tgWebAppData=')) {
          const match = hash.match(/tgWebAppData=([^&]+)/);
          if (match && match[1]) {
            const decodedData = decodeURIComponent(match[1]);
            sessionStorage.setItem('telegram_init_data', decodedData);
            console.log('Saved Telegram data to sessionStorage');
          }
        }
        
        // Инициализируем SDK только если мы внутри Telegram
        if (lp && lp.tgWebAppVersion) {
          console.log('Initializing Telegram SDK...');
          
          // Сначала инициализируем SDK
          init();
          
          // Монтируем компоненты с проверками доступности
          if (miniApp.mountSync.isAvailable()) {
            miniApp.mountSync();
            console.log('MiniApp mounted');
          }
          
          if (themeParams.mountSync.isAvailable()) {
            themeParams.mountSync();
            console.log('ThemeParams mounted');
          }
          
          if (viewport.mount.isAvailable()) {
            viewport.mount();
            console.log('Viewport mounted');
          }
          
          if (backButton.mount.isAvailable()) {
            backButton.mount();
            console.log('BackButton mounted');
          }
          
          if (mainButton.mount.isAvailable()) {
            mainButton.mount();
            console.log('MainButton mounted');
          }

          // Настройка базовых параметров с проверками доступности
          if (miniApp.ready.isAvailable()) {
            miniApp.ready();
            console.log('MiniApp ready');
          }
          
          if (viewport.expand.isAvailable()) {
            viewport.expand();
            console.log('Viewport expanded');
          }
          
          // Скрываем back button по умолчанию
          if (backButton.hide.isAvailable()) {
            backButton.hide();
            console.log('BackButton hidden');
          }
        } else {
          console.log('Not in Telegram environment, skipping SDK initialization');
        }
        
        if (mounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Telegram SDK initialization error:', error);
        if (mounted) {
          setIsInitialized(true); // Все равно показываем приложение
        }
      }
    };

    initTelegram();

    return () => {
      mounted = false;
    };
  }, []);

  // Показываем детей только после инициализации
  if (!isInitialized) {
    return <div className="telegram-init-loading">Initializing...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <UserInit>
        {children}
      </UserInit>
    </QueryClientProvider>
  );
}