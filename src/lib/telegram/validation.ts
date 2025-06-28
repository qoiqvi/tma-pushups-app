// Упрощенная валидация для Edge Runtime (без crypto)
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export function parseInitData(initData: string): TelegramUser | null {
  try {
    const urlParams = new URLSearchParams(initData)
    const userString = urlParams.get('user')
    
    if (!userString) return null
    
    return JSON.parse(userString) as TelegramUser
  } catch {
    return null
  }
}

// Базовая проверка формата данных (без криптографической проверки)
export function validateInitDataFormat(initData: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    const user = urlParams.get('user')
    const authDate = urlParams.get('auth_date')
    
    // Проверяем наличие обязательных полей
    if (!hash || !user || !authDate) return false
    
    // Проверяем, что auth_date не слишком старая (1 час)
    const authTimestamp = parseInt(authDate, 10)
    const currentTimestamp = Math.floor(Date.now() / 1000)
    
    return (currentTimestamp - authTimestamp) <= 3600
  } catch {
    return false
  }
}