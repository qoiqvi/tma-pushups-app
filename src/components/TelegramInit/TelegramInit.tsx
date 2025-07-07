'use client';

import { useEffect, useState } from 'react';
import { initTelegramSDK, mockTelegramEnvironment, isTelegramEnvironment } from '@/lib/telegram/init';

interface TelegramInitProps {
  children: React.ReactNode;
}

export function TelegramInit({ children }: TelegramInitProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // In development, mock Telegram environment if not in Telegram
        if (process.env.NODE_ENV === 'development' && !isTelegramEnvironment()) {
          console.log('[TelegramInit] Mocking Telegram environment for development');
          mockTelegramEnvironment();
        }

        // Initialize Telegram SDK
        await initTelegramSDK();
        
        setIsInitialized(true);
      } catch (err) {
        console.error('[TelegramInit] Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Telegram SDK');
      }
    }

    init();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Initialization Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}