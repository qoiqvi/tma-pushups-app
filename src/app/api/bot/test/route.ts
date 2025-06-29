import { NextRequest, NextResponse } from 'next/server'

// Простой тест без зависимостей
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Проверяем секрет
    const headerToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
    if (headerToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const update = await request.json()
    console.log('Received update:', JSON.stringify(update, null, 2))
    
    // Простой ответ напрямую через fetch
    const chatId = update.message?.chat?.id
    const firstName = update.message?.from?.first_name || 'пользователь'
    
    if (chatId && update.message?.text === '/start') {
      const telegramResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🏋️ Привет, ${firstName}! Это быстрый ответ от тестового бота.\n\nВремя обработки: ${Date.now() - startTime}ms`,
          reply_markup: {
            inline_keyboard: [[
              { 
                text: '🚀 Открыть приложение', 
                web_app: { url: process.env.NEXT_PUBLIC_APP_URL }
              }
            ]]
          }
        })
      })
      
      const result = await telegramResponse.json()
      console.log('Telegram API response:', result)
    }
    
    return NextResponse.json({ 
      ok: true, 
      processTime: Date.now() - startTime 
    })
  } catch (error) {
    console.error('Error in test webhook:', error)
    return NextResponse.json({ 
      error: 'Internal error',
      processTime: Date.now() - startTime 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Test webhook ready',
    url: '/api/bot/test',
    description: 'Use POST with Telegram update to test direct API calls'
  })
}