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
  
  const telegramData = window.Telegram?.WebApp?.initData
  
  if (telegramData) {
    return telegramData
  }
  
  // В режиме разработки используем mock данные
  if (process.env.NODE_ENV === 'development') {
    return mockInitData()
  }
  
  return ''
}