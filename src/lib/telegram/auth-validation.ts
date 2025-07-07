import crypto from 'crypto';

/**
 * Validates Telegram Web App init data
 * Based on Telegram's official validation algorithm
 */
export function validateTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  
  if (!hash) {
    console.error('[Auth] No hash in init data');
    return false;
  }

  // In development mode, accept mock hash
  if (process.env.NODE_ENV === 'development' && hash === 'mock-hash-development') {
    console.log('[Auth] Accepting mock hash in development mode');
    return true;
  }

  // Remove hash from params for validation
  params.delete('hash');

  // Sort parameters alphabetically
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Create secret key
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  // Calculate hash
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const isValid = calculatedHash === hash;
  
  if (!isValid) {
    console.error('[Auth] Invalid hash in init data');
  }

  return isValid;
}

/**
 * Parses Telegram init data
 */
export function parseTelegramInitData(initData: string) {
  const params = new URLSearchParams(initData);
  
  const userStr = params.get('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  return {
    user,
    authDate: params.get('auth_date') ? new Date(parseInt(params.get('auth_date')!) * 1000) : null,
    hash: params.get('hash'),
    queryId: params.get('query_id'),
    chatType: params.get('chat_type'),
    chatInstance: params.get('chat_instance'),
    startParam: params.get('start_param'),
  };
}

/**
 * Checks if init data is not expired
 * @param authDate - Authentication date from init data
 * @param maxAge - Maximum age in seconds (default 24 hours)
 */
export function isInitDataFresh(authDate: Date | null, maxAge: number = 86400): boolean {
  if (!authDate) return false;
  
  const now = new Date();
  const age = (now.getTime() - authDate.getTime()) / 1000;
  
  return age <= maxAge;
}

/**
 * Full validation of Telegram init data
 */
export function validateAndParseTelegramInitData(
  initData: string, 
  botToken: string,
  options?: { maxAge?: number }
): { isValid: boolean; data?: ReturnType<typeof parseTelegramInitData>; error?: string } {
  try {
    // Validate hash
    if (!validateTelegramInitData(initData, botToken)) {
      return { isValid: false, error: 'Invalid hash' };
    }

    // Parse data
    const data = parseTelegramInitData(initData);

    // Check freshness
    if (!isInitDataFresh(data.authDate, options?.maxAge)) {
      return { isValid: false, error: 'Init data expired' };
    }

    // Check required fields
    if (!data.user || !data.user.id) {
      return { isValid: false, error: 'Missing user data' };
    }

    return { isValid: true, data };
  } catch (error) {
    console.error('[Auth] Error validating init data:', error);
    return { isValid: false, error: 'Validation error' };
  }
}