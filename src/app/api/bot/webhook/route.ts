import { NextRequest, NextResponse } from 'next/server'
import { handleBotUpdateOptimized } from '@/lib/bot/handlers-optimized'
import { verifyTelegramWebhook } from '@/lib/bot/utils'
import { BotUpdate } from '@/types/bot'

export const runtime = 'edge' // Используем Edge Runtime для быстрого запуска

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  // Проверяем подпись Telegram
  const isValid = await verifyTelegramWebhook(request)
  if (!isValid) {
    console.log(`[${Date.now() - startTime}ms] Unauthorized webhook attempt`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update: BotUpdate = await request.json()
    
    // Логируем update с временем
    const command = update.message?.text || 'no text'
    const userId = update.message?.from?.id || 'unknown'
    console.log(`[${Date.now() - startTime}ms] Received update from user ${userId}: ${command}`)
    
    // Обрабатываем update асинхронно, чтобы быстро ответить Telegram
    handleBotUpdateOptimized(update).catch(error => {
      console.error(`[${Date.now() - startTime}ms] Error handling bot update:`, error)
    })
    
    // Сразу отвечаем Telegram, что получили update
    console.log(`[${Date.now() - startTime}ms] Returning response to Telegram`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(`[${Date.now() - startTime}ms] Bot webhook error:`, error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET endpoint для проверки работоспособности
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    webhook: '/api/bot/webhook',
    message: 'Telegram Bot webhook endpoint is ready'
  })
}