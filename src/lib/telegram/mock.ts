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
  
  // Метод 1: Telegram SDK
  const telegramData = window.Telegram?.WebApp?.initData
  if (telegramData) {
    logger.info('[getTelegramInitData] Found data in Telegram SDK')
    return telegramData
  }
  
  // Метод 2: URL hash параметры (Telegram Desktop и Web)
  try {
    const fullUrl = window.location.href
    const hash = window.location.hash
    
    logger.info('[getTelegramInitData] Checking URL', { 
      href: fullUrl.substring(0, 100) + '...',
      hash: hash.substring(0, 100) + '...',
      hasHash: hash.length > 0
    })
    
    // Вариант 1: #tgWebAppData=...
    if (hash.includes('tgWebAppData=')) {
      const match = hash.match(/tgWebAppData=([^&]+)/)
      if (match && match[1]) {
        const decodedData = decodeURIComponent(match[1])
        logger.info('[getTelegramInitData] Found tgWebAppData in URL', { 
          length: decodedData.length,
          preview: decodedData.substring(0, 50) + '...'
        })
        return decodedData
      }
    }
    
    // Вариант 2: Прямые параметры в hash
    if (hash.includes('user=')) {
      // Убираем # и возвращаем как есть
      const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash
      logger.info('[getTelegramInitData] Found direct params in URL', { 
        length: cleanHash.length,
        preview: cleanHash.substring(0, 50) + '...'
      })
      return cleanHash
    }
    
    // Вариант 3: Проверяем sessionStorage (Telegram может сохранять туда)
    const storedData = sessionStorage.getItem('telegram_init_data')
    if (storedData) {
      logger.info('[getTelegramInitData] Found data in sessionStorage')
      return storedData
    }
    
    // Вариант 4: Проверяем localStorage как последний fallback
    const backupData = localStorage.getItem('telegram_init_data_backup')
    if (backupData) {
      logger.info('[getTelegramInitData] Found backup data in localStorage')
      return backupData
    }
  } catch (e) {
    logger.error('[getTelegramInitData] Error parsing URL data:', e)
  }
  
  // Метод 3: Mock данные для разработки
  if (process.env.NODE_ENV === 'development') {
    logger.info('[getTelegramInitData] Using mock data')
    return mockInitData()
  }
  
  logger.warn('[getTelegramInitData] No data found anywhere')
  return ''
}