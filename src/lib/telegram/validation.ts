import crypto from 'crypto';
import { logger } from '@/lib/debug';

/**
 * Telegram user interface
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_bot?: boolean;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

/**
 * Parsed Telegram init data
 */
export interface ParsedInitData {
  user: TelegramUser;
  auth_date: number;
  hash: string;
  query_id?: string;
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  data?: ParsedInitData;
  error?: string;
}

/**
 * Parse init data string into structured object
 */
export function parseInitData(initData: string): ParsedInitData | null {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    const authDate = params.get('auth_date');
    const hash = params.get('hash');
    
    if (!userStr || !authDate || !hash) {
      logger.error('[Validation] Missing required fields in init data');
      return null;
    }
    
    const user = JSON.parse(userStr) as TelegramUser;
    
    return {
      user,
      auth_date: parseInt(authDate, 10),
      hash,
      query_id: params.get('query_id') || undefined,
      chat_type: params.get('chat_type') || undefined,
      chat_instance: params.get('chat_instance') || undefined,
      start_param: params.get('start_param') || undefined,
    };
  } catch (error) {
    logger.error('[Validation] Error parsing init data:', error);
    return null;
  }
}

/**
 * Check if init data is not expired
 */
export function isInitDataFresh(authDate: number, maxAge: number = 86400): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - authDate;
  
  if (age > maxAge) {
    logger.warn(`[Validation] Init data expired: ${age}s old (max: ${maxAge}s)`);
    return false;
  }
  
  return true;
}

/**
 * Validate Telegram init data using Node.js crypto (for server-side)
 */
export function validateInitDataNode(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      logger.error('[Validation] No hash in init data');
      return false;
    }
    
    // Accept mock hash in development
    if (process.env.NODE_ENV === 'development' && hash === 'mock-hash-development') {
      logger.info('[Validation] Accepting mock hash in development mode');
      return true;
    }
    
    // Remove hash from params for validation
    params.delete('hash');
    
    // Sort parameters alphabetically
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create secret key using HMAC-SHA256
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
      logger.error('[Validation] Hash mismatch', { 
        calculated: calculatedHash.substring(0, 10) + '...', 
        provided: hash.substring(0, 10) + '...' 
      });
    }
    
    return isValid;
  } catch (error) {
    logger.error('[Validation] Error validating init data:', error);
    return false;
  }
}

/**
 * Validate Telegram init data using Web Crypto API (for Edge runtime)
 */
export async function validateInitDataEdge(initData: string, botToken: string): Promise<boolean> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      logger.error('[Validation] No hash in init data');
      return false;
    }
    
    // Accept mock hash in development
    if (process.env.NODE_ENV === 'development' && hash === 'mock-hash-development') {
      logger.info('[Validation] Accepting mock hash in development mode');
      return true;
    }
    
    // Remove hash from params and sort
    params.delete('hash');
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create secret key using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode('WebAppData');
    const tokenData = encoder.encode(botToken);
    
    // Import the key
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Create secret key
    const secretKey = await crypto.subtle.sign(
      'HMAC',
      key,
      tokenData
    );
    
    // Import secret key for final HMAC
    const secretKeyObj = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Calculate final hash
    const signature = await crypto.subtle.sign(
      'HMAC',
      secretKeyObj,
      encoder.encode(dataCheckString)
    );
    
    // Convert to hex string
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const isValid = calculatedHash === hash;
    
    if (!isValid) {
      logger.error('[Validation] Hash mismatch', { 
        calculated: calculatedHash.substring(0, 10) + '...', 
        provided: hash.substring(0, 10) + '...' 
      });
    }
    
    return isValid;
  } catch (error) {
    logger.error('[Validation] Error validating init data:', error);
    return false;
  }
}

/**
 * Universal validation function that works in both Node.js and Edge runtime
 */
export async function validateInitData(
  initData: string, 
  botToken: string,
  options?: { maxAge?: number }
): Promise<ValidationResult> {
  try {
    // Parse data first
    const parsedData = parseInitData(initData);
    if (!parsedData) {
      return { isValid: false, error: 'Failed to parse init data' };
    }
    
    // Check freshness
    if (!isInitDataFresh(parsedData.auth_date, options?.maxAge)) {
      return { isValid: false, error: 'Init data expired' };
    }
    
    // Validate hash based on runtime
    let isValid = false;
    
    // Check if we're in Node.js environment (has crypto module)
    if (typeof crypto !== 'undefined' && crypto.createHmac) {
      isValid = validateInitDataNode(initData, botToken);
    } else {
      // Use Web Crypto API for Edge runtime
      isValid = await validateInitDataEdge(initData, botToken);
    }
    
    if (!isValid) {
      return { isValid: false, error: 'Invalid hash' };
    }
    
    return { isValid: true, data: parsedData };
  } catch (error) {
    logger.error('[Validation] Error during validation:', error);
    return { isValid: false, error: 'Validation error' };
  }
}

/**
 * Quick validation for development/testing
 */
export function validateInitDataFormat(initData: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const user = params.get('user');
    const authDate = params.get('auth_date');
    
    // Check required fields
    if (!hash || !user || !authDate) {
      logger.warn('[Validation] Missing required fields');
      return false;
    }
    
    // Try to parse user
    JSON.parse(user);
    
    // Check auth_date is a number
    const authTimestamp = parseInt(authDate, 10);
    if (isNaN(authTimestamp)) {
      logger.warn('[Validation] Invalid auth_date');
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('[Validation] Format validation error:', error);
    return false;
  }
}