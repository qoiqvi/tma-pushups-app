import { NextRequest } from 'next/server'
import crypto from 'crypto'

// Проверка подписи webhook от Telegram
export async function verifyTelegramWebhook(request: NextRequest): Promise<boolean> {
  const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  
  if (!secretToken || secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return false
  }
  
  return true
}