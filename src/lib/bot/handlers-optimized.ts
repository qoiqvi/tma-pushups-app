import { BotUpdate, BotMessage, BotUser } from '@/types/bot'

// Прямые HTTP запросы к Telegram API для избежания overhead от библиотеки
async function sendTelegramMessage(chatId: number, text: string, options?: any) {
  const startTime = Date.now()
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: options?.parse_mode || 'HTML',
          reply_markup: options?.reply_markup
        })
      }
    )
    
    const result = await response.json()
    console.log(`[${Date.now() - startTime}ms] Message sent to ${chatId}`)
    
    if (!result.ok) {
      console.error('Telegram API error:', result)
    }
    
    return result
  } catch (error) {
    console.error(`[${Date.now() - startTime}ms] Failed to send message:`, error)
    throw error
  }
}

// Оптимизированный обработчик
export async function handleBotUpdateOptimized(update: BotUpdate) {
  const startTime = Date.now()
  
  try {
    if (!update.message) {
      console.log(`[${Date.now() - startTime}ms] No message in update`)
      return
    }
    
    const message = update.message
    const chatId = message.chat.id
    const text = message.text
    const user = message.from
    
    console.log(`[${Date.now() - startTime}ms] Processing message from ${user.id}: ${text}`)
    
    // Обработка только команды /start для быстрого ответа
    if (text === '/start') {
      const welcomeText = `🏋️ Добро пожаловать в <b>Pushups Tracker</b>, ${user.first_name}!

Этот бот поможет вам отслеживать тренировки отжиманий и напомнит о них в нужное время.

<b>Команды:</b> /settings /stats /help

Откройте приложение для тренировки:`
      
      await sendTelegramMessage(chatId, welcomeText, {
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '🚀 Открыть приложение', 
              web_app: { url: process.env.NEXT_PUBLIC_APP_URL! }
            }
          ]]
        }
      })
      
      console.log(`[${Date.now() - startTime}ms] Start command processed`)
      
      // Асинхронно создаем/обновляем пользователя
      updateUserAsync(user)
    } else if (text?.startsWith('/')) {
      // Для остальных команд - простые ответы
      await sendTelegramMessage(
        chatId,
        '⏳ Команда обрабатывается. Пожалуйста, подождите...'
      )
      
      // Затем обрабатываем в фоне
      processCommandAsync(chatId, text, user)
    }
    
    console.log(`[${Date.now() - startTime}ms] Update handling completed`)
  } catch (error) {
    console.error(`[${Date.now() - startTime}ms] Error in handleBotUpdateOptimized:`, error)
  }
}

// Асинхронное обновление пользователя
function updateUserAsync(user: BotUser) {
  // Используем fetch для Supabase API напрямую
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  fetch(`${supabaseUrl}/rest/v1/users`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      telegram_id: user.id,
      username: user.username || null,
      first_name: user.first_name,
      last_name: user.last_name || null,
      language_code: user.language_code || 'ru',
      is_premium: user.is_premium || false,
      updated_at: new Date().toISOString()
    })
  }).catch(error => {
    console.error('Failed to update user:', error)
  })
}

// Асинхронная обработка команд
async function processCommandAsync(chatId: number, command: string, user: BotUser) {
  const [cmd] = command.split(' ')
  
  try {
    switch (cmd) {
      case '/settings':
      case '/stats':
        // Эти команды требуют запросов к БД - обрабатываем их через основной handler
        const { handleBotUpdate } = await import('./handlers')
        await handleBotUpdate({
          message: {
            chat: { id: chatId, type: 'private' },
            from: user,
            text: command,
            message_id: 0,
            date: Math.floor(Date.now() / 1000)
          }
        })
        break
        
      case '/help':
        const helpText = `❓ <b>Помощь</b>

<b>Доступные команды:</b>
/start - Приветствие и запуск бота
/settings - Просмотр настроек напоминаний
/stats - Ваша статистика тренировок
/help - Эта справка

<b>Совет:</b> Регулярные тренировки - ключ к успеху! 💪`
        
        await sendTelegramMessage(chatId, helpText)
        break
        
      default:
        await sendTelegramMessage(
          chatId,
          '❓ Неизвестная команда. Используйте /help для списка доступных команд.'
        )
    }
  } catch (error) {
    console.error('Error processing command:', error)
    await sendTelegramMessage(
      chatId,
      '❌ Произошла ошибка при обработке команды. Попробуйте позже.'
    )
  }
}