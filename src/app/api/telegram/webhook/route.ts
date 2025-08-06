import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cache, cacheKeys } from '@/lib/telegram/cache'
import { logger } from '@/lib/debug'

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

// Process update asynchronously
async function processUpdate(update: TelegramUpdate) {
  try {
    if (!update.message || !update.message.text) {
      return;
    }
    
    const message = update.message
    const text = message.text
    const chatId = message.chat.id
    const user = message.from
    
    // Handle /start command
    if (text && (text === '/start' || text.startsWith('/start '))) {
      await handleStartCommand(chatId, user)
    }
  } catch (error) {
    logger.error('[Webhook] Error processing update:', error)
  }
}

// Optimized start command handler
async function handleStartCommand(chatId: number, user: TelegramUser) {
  logger.info(`[Bot] Handling /start for user ${user.id}`)
  
  try {
    // Check cache first
    const cacheKey = cacheKeys.user(user.id)
    let existingUser = cache.get(cacheKey)
    
    if (!existingUser) {
      // Try to fetch from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', user.id)
        .single()
      
      if (!error || error.code === 'PGRST116') {
        existingUser = data
        if (existingUser) {
          cache.set(cacheKey, existingUser, 600000) // Cache for 10 minutes
        }
      }
    }
    
    // Prepare user data
    const userData = {
      telegram_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name || null,
      username: user.username || null,
      is_premium: user.is_premium || false,
      created_at: new Date().toISOString()
    }
    
    // Upsert user (insert or update)
    const { data: upsertedUser, error: upsertError } = await supabase
      .from('users')
      .upsert(userData, { 
        onConflict: 'telegram_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()
    
    if (upsertError) {
      logger.error('[Bot] Error upserting user:', upsertError)
    } else {
      // Update cache
      cache.set(cacheKey, upsertedUser, 600000)
      logger.info(`[Bot] User ${user.id} upserted successfully`)
    }
    
    // Send welcome message immediately
    await sendWelcomeMessage(chatId, user.first_name)
  } catch (error) {
    logger.error('[Bot] Error in handleStartCommand:', error)
    // Still try to send a basic welcome message
    await sendWelcomeMessage(chatId, user.first_name)
  }
}

// Send welcome message
async function sendWelcomeMessage(chatId: number, firstName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tma-pushups-app.vercel.app'
  const message = `🏋️ Добро пожаловать, ${firstName}!

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
}

// Optimized message sending
async function sendMessage(chatId: number, text: string, options: any = {}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    logger.error('[Bot] No bot token found')
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
      logger.error('[Bot] Failed to send message:', result)
    } else {
      logger.info('[Bot] Message sent successfully')
    }
  } catch (error) {
    logger.error('[Bot] Error sending message:', error)
  }
}

// Webhook handler - optimized for fast response
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const update: TelegramUpdate = await request.json()
    logger.info('[Webhook] Received update:', { 
      updateId: update.update_id,
      hasMessage: !!update.message,
      messageText: update.message?.text?.substring(0, 20)
    })
    
    // Process update asynchronously - don't wait
    processUpdate(update).catch(error => {
      logger.error('[Webhook] Async processing error:', error)
    })
    
    // Respond immediately to Telegram
    const responseTime = Date.now() - startTime
    logger.info(`[Webhook] Responding to Telegram in ${responseTime}ms`)
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('[Webhook] Error parsing request:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}