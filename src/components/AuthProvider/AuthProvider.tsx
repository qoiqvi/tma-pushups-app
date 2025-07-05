'use client';

import { type PropsWithChildren, useEffect } from 'react';
import { getTelegramUserId, saveTelegramUserId } from '@/lib/auth/client';
import { useRouter, usePathname } from 'next/navigation';

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Пытаемся получить ID пользователя при загрузке
    const userId = getTelegramUserId();
    
    if (userId) {
      console.log('[AuthProvider] User authenticated:', userId);
      saveTelegramUserId(userId);
    } else {
      console.warn('[AuthProvider] No user ID found');
      // Редирект на страницу авторизации, если не на ней
      if (pathname !== '/auth' && process.env.NODE_ENV === 'production') {
        router.push('/auth');
      }
    }
  }, [router, pathname]);

  return <>{children}</>;
}