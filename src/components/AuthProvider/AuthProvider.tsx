'use client';

import { type PropsWithChildren, useEffect } from 'react';
import { getTelegramUserId, saveTelegramUserId } from '@/lib/auth/client';

export function AuthProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    // Пытаемся получить ID пользователя при загрузке
    const userId = getTelegramUserId();
    
    if (userId) {
      console.log('[AuthProvider] User authenticated:', userId);
      saveTelegramUserId(userId);
    } else {
      console.warn('[AuthProvider] No user ID found');
    }
  }, []);

  return <>{children}</>;
}