import { NextRequest, NextResponse } from 'next/server';
import { validateAndParseTelegramInitData } from '@/lib/telegram/auth-validation';
import { supabaseAdmin } from '@/lib/supabase';

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
  // Get init data from header
  const initData = request.headers.get('X-Telegram-Init-Data');
  
  if (!initData) {
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
    console.error('[API] TELEGRAM_BOT_TOKEN not configured');
    return {
      error: NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    };
  }

  const validation = validateAndParseTelegramInitData(initData, botToken);
  
  if (!validation.isValid || !validation.data?.user) {
    return {
      error: NextResponse.json(
        { error: validation.error || 'Invalid init data' },
        { status: 401 }
      )
    };
  }

  const telegramUser = validation.data.user;

  // Get or create user in database
  let dbUser = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('telegram_id', telegramUser.id)
    .single();

  if (dbUser.error && dbUser.error.code !== 'PGRST116') {
    console.error('[API] Database error:', dbUser.error);
    return {
      error: NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    };
  }

  // Create user if not exists
  if (!dbUser.data) {
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
      console.error('[API] Failed to create user:', createResult.error);
      return {
        error: NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      };
    }

    dbUser = createResult;
  } else {
    // Update user data if changed
    const updateResult = await supabaseAdmin
      .from('users')
      .update({
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        is_premium: telegramUser.is_premium || false
      })
      .eq('telegram_id', telegramUser.id)
      .select()
      .single();

    if (updateResult.data) {
      dbUser = updateResult;
    }
  }

  return {
    user: {
      id: dbUser.data.telegram_id,
      telegramId: dbUser.data.telegram_id,
      username: dbUser.data.username || undefined,
      firstName: dbUser.data.first_name || undefined,
      lastName: dbUser.data.last_name || undefined,
      languageCode: dbUser.data.language_code || 'en',
      isPremium: dbUser.data.is_premium || false
    }
  };
}

/**
 * Helper to check if the result is an error
 */
export function isAuthError(
  result: { user: AuthenticatedUser } | { error: NextResponse }
): result is { error: NextResponse } {
  return 'error' in result;
}