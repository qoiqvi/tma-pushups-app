import crypto from 'crypto'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export function validateTelegramWebAppData(initData: string): TelegramUser | null {
  const urlParams = new URLSearchParams(initData)
  const hash = urlParams.get('hash')
  urlParams.delete('hash')
  
  // Сортируем параметры
  const checkString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  
  // Проверяем подпись
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest()
  
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex')
  
  if (calculatedHash !== hash) {
    return null
  }
  
  // Парсим user data
  const userString = urlParams.get('user')
  if (!userString) return null
  
  try {
    return JSON.parse(userString) as TelegramUser
  } catch {
    return null
  }
}

// Дополнительная функция для проверки времени подписи (опционально)
export function checkInitDataAge(initData: string, maxAgeSeconds: number = 3600): boolean {
  const urlParams = new URLSearchParams(initData)
  const authDate = urlParams.get('auth_date')
  
  if (!authDate) return false
  
  const authTimestamp = parseInt(authDate, 10)
  const currentTimestamp = Math.floor(Date.now() / 1000)
  
  return (currentTimestamp - authTimestamp) <= maxAgeSeconds
}