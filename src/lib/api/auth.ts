import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/telegram/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { cache, cacheKeys } from '@/lib/telegram/cache';
import { logger } from '@/lib/debug';

export interface AuthenticatedUser {
  id: number;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode: string;
  isPremium: boolean;
}

/**
 * Authenticates a request and returns the user
 * This should be used at the beginning of all protected API routes
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const startTime = Date.now();
  
  // Get init data from header
  const initData = request.headers.get('X-Telegram-Init-Data');
  
  logger.debug('[Auth] Request authentication started', {
    hasInitData: !!initData,
    path: request.nextUrl.pathname
  });
  
  if (!initData) {
    logger.warn('[Auth] Missing Telegram init data header');
    return {
      error: NextResponse.json(
        { error: 'Missing Telegram init data' },
        { status: 401 }
      )
    };
  }

  // Validate init data
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    logger.error('[Auth] TELEGRAM_BOT_TOKEN not configured');
    return {
      error: NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    };
  }

  const validation = await validateInitData(initData, botToken);
  
  if (!validation.isValid || !validation.data?.user) {
    logger.warn('[Auth] Invalid init data', { error: validation.error });
    return {
      error: NextResponse.json(
        { error: validation.error || 'Invalid init data' },
        { status: 401 }
      )
    };
  }

  const telegramUser = validation.data.user;

  // Check cache first
  const cacheKey = cacheKeys.user(telegramUser.id);
  let dbUserData = cache.get(cacheKey);
  
  if (!dbUserData) {
    // Get or create user in database
    let dbUser = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .single();

    if (dbUser.error && dbUser.error.code !== 'PGRST116') {
      logger.error('[Auth] Database error:', dbUser.error);
      return {
        error: NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      };
    }
    
    dbUserData = dbUser.data;
    
    // Create user if not exists
    if (!dbUserData) {
      const createResult = await supabaseAdmin
        .from('users')
        .insert({
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          language_code: telegramUser.language_code || 'ru',
          is_premium: telegramUser.is_premium || false
        })
        .select()
        .single();

      if (createResult.error) {
        logger.error('[Auth] Failed to create user:', createResult.error);
        return {
          error: NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
          )
        };
      }

      dbUserData = createResult.data;
      logger.info('[Auth] Created new user', { telegramId: telegramUser.id });
    }
    
    // Cache user data
    if (dbUserData) {
      cache.set(cacheKey, dbUserData, 600000); // Cache for 10 minutes
    }
  } else {
    logger.debug('[Auth] User found in cache');
  }

  // Transform to authenticated user
  const user: AuthenticatedUser = {
    id: dbUserData.id,
    telegramId: dbUserData.telegram_id,
    username: dbUserData.username,
    firstName: dbUserData.first_name,
    lastName: dbUserData.last_name,
    languageCode: dbUserData.language_code || 'ru',
    isPremium: dbUserData.is_premium || false
  };

  const authTime = Date.now() - startTime;
  logger.debug(`[Auth] Authentication completed in ${authTime}ms`);

  return { user };
}

/**
 * Helper function to get user from request
 * Returns null if authentication fails
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const result = await authenticateRequest(request);
  
  if ('error' in result) {
    return null;
  }
  
  return result.user;
}