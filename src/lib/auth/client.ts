import { getRawInitData } from '@/lib/telegram/init';

// Create headers for API requests with Telegram init data
export function getAuthHeaders(): HeadersInit {
  const initData = getRawInitData();
  
  if (!initData) {
    return {};
  }
  
  return {
    'X-Telegram-Init-Data': initData
  };
}

// Check if authenticated (has init data)
export function isAuthenticated(): boolean {
  return getRawInitData() !== null;
}

// Legacy functions for backward compatibility (will be removed)
export function getTelegramUserId(): number | null {
  console.warn('getTelegramUserId is deprecated. Use useTelegramAuth hook instead.');
  return null;
}

export function saveTelegramUserId(userId: number) {
  console.warn('saveTelegramUserId is deprecated and no longer functional.');
}

export function clearAuth() {
  console.warn('clearAuth is deprecated. Authentication is now handled by Telegram SDK.');
}