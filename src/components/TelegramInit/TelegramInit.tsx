'use client';

import { type PropsWithChildren, useEffect, useState } from 'react';
import {
  retrieveLaunchParams,
  miniApp,
  themeParams,
  viewport,
  backButton,
  mainButton,
  initData,
} from '@telegram-apps/sdk-react';

export function TelegramInit({ children }: PropsWithChildren) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initTelegram = async () => {
      try {
        // Проверяем, что мы в Telegram окружении
        if (typeof window === 'undefined') return;
        
        // Получаем параметры запуска
        const lp = retrieveLaunchParams();
        
        // Инициализируем SDK только если мы внутри Telegram
        if (lp && lp.tgWebAppVersion) {
          // Инициализируем основные компоненты с проверками
          if (!miniApp.isMounted()) {
            miniApp.mount();
          }
          
          if (!themeParams.isMounted()) {
            themeParams.mount();
          }
          
          if (!viewport.isMounted()) {
            viewport.mount();
          }
          
          if (!backButton.isMounted() && backButton.isSupported()) {
            backButton.mount();
          }
          
          if (!mainButton.isMounted() && mainButton.isSupported()) {
            mainButton.mount();
          }
          
          if (!initData.isMounted()) {
            initData.mount();
          }

          // Настройка базовых параметров
          if (miniApp.isSupported()) {
            miniApp.ready();
          }
          
          if (viewport.isSupported()) {
            viewport.expand();
          }
          
          // Скрываем back button по умолчанию
          if (backButton.isSupported() && backButton.isMounted()) {
            backButton.hide();
          }
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

  return <>{children}</>;
}