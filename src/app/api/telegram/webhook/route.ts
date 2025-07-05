import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Инициализация Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Типы для Telegram
interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

interface TelegramMessage {
  message_id: number
  from: TelegramUser
  chat: {
    id: number
    type: string
  }
  date: number
  text?: string
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

// Обработчик webhook от Telegram
export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()
    console.log('[Telegram Webhook] Received update:', update)
    
    // Проверяем что это сообщение
    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true })
    }
    
    const message = update.message
    const text = message.text
    const chatId = message.chat.id
    const user = message.from
    
    // Обрабатываем команду /start
    if (text && (text === '/start' || text.startsWith('/start '))) {
      await handleStartCommand(chatId, user)
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// Обработчик команды /start
async function handleStartCommand(chatId: number, user: TelegramUser) {
  console.log('[Telegram Bot] Handling /start command for user:', user.id)
  
  try {
    // Проверяем есть ли пользователь в базе
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', user.id)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }
    
    // Если пользователя нет - создаем
    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name || null,
          username: user.username || null,
          is_premium: user.is_premium || false,
          created_at: new Date().toISOString()
        })
      
      if (insertError) {
        throw insertError
      }
      
      console.log('[Telegram Bot] Created new user:', user.id)
    } else {
      // Обновляем данные существующего пользователя
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: user.first_name,
          last_name: user.last_name || null,
          username: user.username || null,
          is_premium: user.is_premium || false
        })
        .eq('telegram_id', user.id)
      
      if (updateError) {
        throw updateError
      }
      
      console.log('[Telegram Bot] Updated user:', user.id)
    }
    
    // Отправляем приветственное сообщение
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tma-pushups-app.vercel.app'
    const message = `🏋️ Добро пожаловать в PushUps Tracker!

Я помогу вам отслеживать ваши отжимания и прогресс.

Нажмите кнопку ниже, чтобы открыть приложение:`
    
    await sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🚀 Открыть приложение',
            web_app: { url: appUrl }
          }
        ]]
      }
    })
  } catch (error) {
    console.error('[Telegram Bot] Error handling /start:', error)
    await sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.')
  }
}

// Функция отправки сообщения
async function sendMessage(chatId: number, text: string, options: any = {}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('[Telegram Bot] No bot token found')
    return
  }
  
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...options
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    const result = await response.json()
    if (!result.ok) {
      console.error('[Telegram Bot] Failed to send message:', result)
    }
  } catch (error) {
    console.error('[Telegram Bot] Error sending message:', error)
  }
}