// Простая система авторизации для Telegram Mini App

// Получаем ID пользователя из Telegram
export function getTelegramUserId(): number | null {
  if (typeof window === 'undefined') return null
  
  try {
    // Метод 1: Из Telegram WebApp SDK
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return window.Telegram.WebApp.initDataUnsafe.user.id
    }
    
    // Метод 2: Из URL параметров
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.slice(1))
      const userStr = params.get('user')
      if (userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr))
          if (user.id) return user.id
        } catch (e) {
          console.error('Error parsing user from URL:', e)
        }
      }
    }
    
    // Метод 3: Из localStorage (для сохраненных сессий)
    const savedUserId = localStorage.getItem('telegram_user_id')
    if (savedUserId) {
      return parseInt(savedUserId)
    }
    
    // Метод 4: Для разработки
    if (process.env.NODE_ENV === 'development') {
      return 12345 // Test user ID
    }
  } catch (error) {
    console.error('Error getting Telegram user ID:', error)
  }
  
  return null
}

// Сохраняем ID пользователя
export function saveTelegramUserId(userId: number) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('telegram_user_id', userId.toString())
  }
}

// Очищаем данные авторизации
export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('telegram_user_id')
  }
}

// Проверяем авторизацию
export function isAuthenticated(): boolean {
  return getTelegramUserId() !== null
}

// Создаем заголовки для API запросов
export function getAuthHeaders(): HeadersInit {
  const userId = getTelegramUserId()
  
  if (!userId) {
    return {}
  }
  
  return {
    'X-User-Id': userId.toString()
  }
}