'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { initData } from '@telegram-apps/sdk-react';
import { getRawInitData, getTelegramUser } from '@/lib/telegram/init';

interface User {
  id: number;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode: string;
  isPremium: boolean;
}

interface TelegramAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const TelegramAuthContext = createContext<TelegramAuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  refetch: async () => {},
});

export function useTelegramAuth() {
  const context = useContext(TelegramAuthContext);
  if (!context) {
    throw new Error('useTelegramAuth must be used within TelegramAuthProvider');
  }
  return context;
}

interface TelegramAuthProviderProps {
  children: React.ReactNode;
}

export function TelegramAuthProvider({ children }: TelegramAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get raw init data for authentication
      const rawInitData = getRawInitData();
      
      if (!rawInitData) {
        console.log('[TelegramAuth] No init data available');
        setUser(null);
        return;
      }

      // Fetch user from API with init data
      const response = await fetch('/api/user/me', {
        headers: {
          'X-Telegram-Init-Data': rawInitData,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[TelegramAuth] User not authenticated');
          setUser(null);
          return;
        }
        throw new Error('Failed to fetch user');
      }

      const userData = await response.json();
      setUser(userData);
      
      console.log('[TelegramAuth] User authenticated:', userData.telegramId);
    } catch (err) {
      console.error('[TelegramAuth] Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to authenticate');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!isLoading && !user && !error) {
      const telegramUser = getTelegramUser();
      if (!telegramUser) {
        console.log('[TelegramAuth] No Telegram user, redirecting to auth');
        router.push('/auth');
      }
    }
  }, [isLoading, user, error, router]);

  const value: TelegramAuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch: fetchUser,
  };

  return (
    <TelegramAuthContext.Provider value={value}>
      {children}
    </TelegramAuthContext.Provider>
  );
}