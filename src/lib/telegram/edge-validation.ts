// Edge-compatible Telegram validation
// Based on official Telegram documentation

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_bot?: boolean
  is_premium?: boolean
  added_to_attachment_menu?: boolean
  allows_write_to_pm?: boolean
  photo_url?: string
}

export interface ValidatedData {
  user: TelegramUser
  auth_date: number
  hash: string
}

// Parse init data without validation (for development or when bot token is not available)
export function parseInitData(initData: string): ValidatedData | null {
  try {
    const params = new URLSearchParams(initData)
    const userStr = params.get('user')
    const authDate = params.get('auth_date')
    const hash = params.get('hash')
    
    if (!userStr || !authDate || !hash) {
      return null
    }
    
    const user = JSON.parse(userStr) as TelegramUser
    
    return {
      user,
      auth_date: parseInt(authDate),
      hash
    }
  } catch (error) {
    console.error('Error parsing init data:', error)
    return null
  }
}

// Validate init data using Web Crypto API (Edge-compatible)
export async function validateInitData(
  initData: string,
  botToken: string
): Promise<ValidatedData | null> {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    
    if (!hash) {
      console.error('No hash in init data')
      return null
    }
    
    // Remove hash from params and sort
    params.delete('hash')
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    
    // Create secret key using HMAC-SHA256
    const encoder = new TextEncoder()
    const keyData = encoder.encode('WebAppData')
    const tokenData = encoder.encode(botToken)
    
    // Import the key
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    // Create secret key
    const secretKey = await crypto.subtle.sign(
      'HMAC',
      key,
      tokenData
    )
    
    // Import secret key for final HMAC
    const secretKeyObj = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    // Calculate final hash
    const signature = await crypto.subtle.sign(
      'HMAC',
      secretKeyObj,
      encoder.encode(dataCheckString)
    )
    
    // Convert to hex string
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    // Compare hashes
    if (calculatedHash !== hash) {
      console.error('Hash mismatch:', { calculated: calculatedHash, provided: hash })
      return null
    }
    
    // Parse and return validated data
    return parseInitData(initData)
  } catch (error) {
    console.error('Error validating init data:', error)
    return null
  }
}