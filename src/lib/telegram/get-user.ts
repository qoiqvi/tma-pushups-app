import { headers } from 'next/headers';
import { validateAndParseTelegramInitData } from './auth-validation';

/**
 * Gets authenticated user from request headers
 * For use in server components and API routes
 */
export async function getTelegramUserFromRequest() {
  const headersList = await headers();
  const initData = headersList.get('X-Telegram-Init-Data');
  
  if (!initData) {
    return null;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('[Auth] TELEGRAM_BOT_TOKEN not configured');
    return null;
  }

  const validation = validateAndParseTelegramInitData(initData, botToken);
  
  if (!validation.isValid || !validation.data) {
    return null;
  }

  return validation.data.user;
}

/**
 * Gets authenticated user ID from request headers
 */
export async function getTelegramUserIdFromRequest(): Promise<number | null> {
  const user = await getTelegramUserFromRequest();
  return user?.id || null;
}