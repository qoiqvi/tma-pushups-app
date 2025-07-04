'use client';

import { type PropsWithChildren, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';

export function UserInit({ children }: PropsWithChildren) {
  const { data: user, isLoading, error } = useUser();

  useEffect(() => {
    if (user) {
      console.log('[UserInit] User initialized:', user);
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      console.error('[UserInit] Failed to initialize user:', error);
    }
  }, [error]);

  // Не блокируем рендеринг, просто инициализируем пользователя в фоне
  return <>{children}</>;
}