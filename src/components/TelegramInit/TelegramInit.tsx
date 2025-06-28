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
          
          if (!backButton.isMounted()) {
            try {
              backButton.mount();
            } catch (err) {
              console.warn('Failed to mount backButton:', err);
            }
          }
          
          if (!mainButton.isMounted()) {
            try {
              mainButton.mount();
            } catch (err) {
              console.warn('Failed to mount mainButton:', err);
            }
          }
          

          // Настройка базовых параметров
          try {
            miniApp.ready();
          } catch (err) {
            console.warn('Failed to ready miniApp:', err);
          }
          
          try {
            viewport.expand();
          } catch (err) {
            console.warn('Failed to expand viewport:', err);
          }
          
          // Скрываем back button по умолчанию
          if (backButton.isMounted()) {
            try {
              backButton.hide();
            } catch (err) {
              console.warn('Failed to hide backButton:', err);
            }
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