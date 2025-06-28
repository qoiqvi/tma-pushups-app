'use client';

import { type PropsWithChildren, useEffect, useState } from 'react';
import {
  retrieveLaunchParams,
  miniApp,
  themeParams,
  viewport,
  backButton,
  mainButton,
  init,
} from '@telegram-apps/sdk-react';

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

  return <>{children}</>;
}