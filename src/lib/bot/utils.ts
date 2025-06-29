import { NextRequest } from 'next/server'

// Верификация webhook от Telegram
export async function verifyTelegramWebhook(request: NextRequest): Promise<boolean> {
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secretToken) {
    console.error('TELEGRAM_WEBHOOK_SECRET not set')
    return false
  }

  const headerToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  
  if (!headerToken) {
    console.error('No secret token in webhook request')
    return false
  }
  
  return headerToken === secretToken
}

// Форматирование дней недели
export function formatDaysOfWeek(days: number[]): string {
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  return days
    .sort((a, b) => a - b)
    .map(day => dayNames[day])
    .join(', ')
}

// Форматирование времени
export function formatTime(timeString: string): string {
  // Убираем секунды из времени "09:00:00" -> "09:00"
  return timeString.slice(0, 5)
}

// Генерация случайного ID для callback
export function generateCallbackId(): string {
  return Math.random().toString(36).substring(7)
}