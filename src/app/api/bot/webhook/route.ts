import { NextRequest, NextResponse } from 'next/server'
import { handleBotUpdate } from '@/lib/bot/handlers'
import { verifyTelegramWebhook } from '@/lib/bot/utils'
import { BotUpdate } from '@/types/bot'

export async function POST(request: NextRequest) {
  // Проверяем подпись Telegram
  const isValid = await verifyTelegramWebhook(request)
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update: BotUpdate = await request.json()
    
    // Логируем update для отладки (можно убрать в production)
    console.log('Telegram update:', JSON.stringify(update, null, 2))
    
    // Обрабатываем update асинхронно, чтобы быстро ответить Telegram
    handleBotUpdate(update).catch(error => {
      console.error('Error handling bot update:', error)
    })
    
    // Сразу отвечаем Telegram, что получили update
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Bot webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET endpoint для проверки работоспособности
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    webhook: '/api/bot/webhook',
    message: 'Telegram Bot webhook endpoint is ready'
  })
}