import { NextRequest, NextResponse } from 'next/server'
import { handleBotUpdateMinimal } from '@/lib/bot/handlers-minimal'
import { verifyTelegramWebhook } from '@/lib/bot/utils'
import { BotUpdate } from '@/types/bot'

export const runtime = 'edge' // Edge Runtime для мгновенного ответа

export async function POST(request: NextRequest) {
  // Проверяем подпись Telegram
  const isValid = await verifyTelegramWebhook(request)
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update: BotUpdate = await request.json()
    
    // Обрабатываем update СИНХРОННО чтобы ответ отправился сразу
    await handleBotUpdateMinimal(update)
    
    // Отвечаем Telegram только после отправки сообщения пользователю
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Bot webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    webhook: '/api/bot/webhook',
    message: 'Telegram Bot webhook endpoint is ready'
  })
}