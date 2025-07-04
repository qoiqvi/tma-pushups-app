import { logger } from '@/lib/debug'

// Mock данные для разработки вне Telegram
export const mockInitData = () => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Создаем mock данные в формате Telegram initData
    const mockUser = {
      id: 12345,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'ru'
    }
    
    const authDate = Math.floor(Date.now() / 1000)
    const hash = 'mock_hash_for_development'
    
    // Формируем initData в правильном формате
    const params = new URLSearchParams({
      user: JSON.stringify(mockUser),
      auth_date: authDate.toString(),
      hash: hash
    })
    
    return params.toString()
  }
  
  return ''
}

// Получить initData с fallback на mock в режиме разработки
export const getTelegramInitData = () => {
  if (typeof window === 'undefined') return ''
  
  // Сначала пробуем получить из Telegram SDK
  const telegramData = window.Telegram?.WebApp?.initData
  
  if (telegramData) {
    logger.info('[getTelegramInitData] Found data in Telegram SDK')
    return telegramData
  }
  
  // Если SDK не работает, пробуем получить из URL (для Telegram Desktop)
  try {
    const urlParams = new URLSearchParams(window.location.hash.slice(1))
    const tgWebAppData = urlParams.get('tgWebAppData')
    
    if (tgWebAppData) {
      // Декодируем данные из URL
      const decodedData = decodeURIComponent(tgWebAppData)
      logger.info('[getTelegramInitData] Found data in URL', { length: decodedData.length })
      return decodedData
    }
  } catch (e) {
    logger.error('[getTelegramInitData] Error parsing URL data:', e)
  }
  
  // В режиме разработки используем mock данные
  if (process.env.NODE_ENV === 'development') {
    logger.info('[getTelegramInitData] Using mock data')
    return mockInitData()
  }
  
  logger.warn('[getTelegramInitData] No data found')
  return ''
}