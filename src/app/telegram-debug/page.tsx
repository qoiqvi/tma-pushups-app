'use client';

import { useEffect, useState } from 'react';

export default function TelegramDebugPage() {
  const [telegramData, setTelegramData] = useState<any>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const data: any = {
      windowTelegram: !!window.Telegram,
      webApp: !!window.Telegram?.WebApp,
    };

    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      data.webAppData = {
        initData: webApp.initData || 'empty',
        initDataLength: webApp.initData ? webApp.initData.length : 0,
        initDataUnsafe: webApp.initDataUnsafe || {},
        version: webApp.version,
        platform: webApp.platform,
        colorScheme: webApp.colorScheme,
        themeParams: webApp.themeParams,
        isExpanded: webApp.isExpanded,
        viewportHeight: webApp.viewportHeight,
        viewportStableHeight: webApp.viewportStableHeight,
        isClosingConfirmationEnabled: webApp.isClosingConfirmationEnabled,
        headerColor: webApp.headerColor,
        backgroundColor: webApp.backgroundColor,
        BackButton: {
          isVisible: webApp.BackButton?.isVisible
        },
        MainButton: {
          text: webApp.MainButton?.text,
          color: webApp.MainButton?.color,
          textColor: webApp.MainButton?.textColor,
          isVisible: webApp.MainButton?.isVisible,
          isActive: webApp.MainButton?.isActive,
          isProgressVisible: webApp.MainButton?.isProgressVisible
        }
      };

      // Попробуем все методы получения данных
      data.dataExtractionAttempts = {
        method1_initData: webApp.initData || null,
        method2_initDataUnsafe: webApp.initDataUnsafe || null,
        method3_urlHash: window.location.hash || null,
        method4_urlSearch: window.location.search || null,
        method5_sessionStorage: {
          telegram_init_data: sessionStorage.getItem('telegram_init_data'),
          __telegram__initData: sessionStorage.getItem('__telegram__initData'),
        },
        method6_localStorage: {
          telegram_init_data_backup: localStorage.getItem('telegram_init_data_backup'),
          telegram_user_id: localStorage.getItem('telegram_user_id'),
        }
      };
    }

    // Проверяем все window свойства, связанные с Telegram
    data.windowProperties = Object.keys(window)
      .filter(key => key.toLowerCase().includes('telegram'))
      .reduce((acc, key) => {
        acc[key] = (window as any)[key];
        return acc;
      }, {} as any);

    setTelegramData(data);
  }, []);

  const testInitDataConstruction = () => {
    if (!window.Telegram?.WebApp?.initDataUnsafe) {
      alert('No initDataUnsafe available');
      return;
    }

    const unsafe = window.Telegram.WebApp.initDataUnsafe;
    const params = new URLSearchParams();
    
    if (unsafe.user) {
      params.append('user', JSON.stringify(unsafe.user));
    }
    if (unsafe.auth_date) {
      params.append('auth_date', unsafe.auth_date.toString());
    }
    if (unsafe.hash) {
      params.append('hash', unsafe.hash);
    }
    if (unsafe.query_id) {
      params.append('query_id', unsafe.query_id);
    }

    const constructed = params.toString();
    console.log('Constructed initData:', constructed);
    alert(`Constructed initData (${constructed.length} chars): ${constructed.substring(0, 100)}...`);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Telegram Debug Information</h1>
      
      <div className="space-y-4">
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
          {JSON.stringify(telegramData, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <button
          onClick={testInitDataConstruction}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Init Data Construction
        </button>
      </div>

      <div className="mt-4 p-4 bg-yellow-100 rounded">
        <h2 className="font-bold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Check if window.Telegram.WebApp.initData exists</li>
          <li>If not, check window.Telegram.WebApp.initDataUnsafe</li>
          <li>If initDataUnsafe exists but initData doesn&apos;t, we need to construct it</li>
          <li>The constructed data must include: user, auth_date, and hash at minimum</li>
        </ol>
      </div>
    </div>
  );
}