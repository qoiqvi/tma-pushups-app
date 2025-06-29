import { BotUpdate, BotUser } from '@/types/bot'

// Edge-совместимый обработчик - без зависимостей от Node.js библиотек
export async function handleBotUpdateEdge(update: BotUpdate) {
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
    
    // Обработка команды /start
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
    } 
    // Обработка команды /stats
    else if (text === '/stats') {
      await handleStatsCommand(chatId, user.id)
    }
    // Обработка команды /settings  
    else if (text === '/settings') {
      await handleSettingsCommand(chatId, user.id)
    }
    // Обработка команды /help
    else if (text === '/help') {
      const helpText = `❓ <b>Помощь</b>

<b>Доступные команды:</b>
/start - Приветствие и запуск бота
/settings - Просмотр настроек напоминаний
/stats - Ваша статистика тренировок
/help - Эта справка

<b>Совет:</b> Регулярные тренировки - ключ к успеху! 💪`
      
      await sendTelegramMessage(chatId, helpText)
    }
    // Неизвестная команда
    else if (text?.startsWith('/')) {
      await sendTelegramMessage(
        chatId,
        '❓ Неизвестная команда. Используйте /help для списка доступных команд.'
      )
    }
    
    console.log(`[${Date.now() - startTime}ms] Update handling completed`)
  } catch (error) {
    console.error(`[${Date.now() - startTime}ms] Error in handleBotUpdateEdge:`, error)
  }
}

// Прямые HTTP запросы к Telegram API (Edge-совместимо)
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

// Асинхронное обновление пользователя (Edge-совместимо)
function updateUserAsync(user: BotUser) {
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

// Edge-совместимый обработчик команды /stats
async function handleStatsCommand(chatId: number, userId: number) {
  const startTime = Date.now()
  console.log(`[handleStatsCommand] Starting for user ${userId}`)
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const response = await fetch(`${supabaseUrl}/rest/v1/user_stats?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`[handleStatsCommand] Supabase responded in ${Date.now() - startTime}ms`)
    
    const data = await response.json()
    const stats = data?.[0]
    
    let messageText: string
    let replyMarkup: any
    
    if (!stats || stats.total_workouts === 0) {
      messageText = `📊 <b>Ваша статистика</b>

У вас пока нет тренировок. Начните свою первую тренировку прямо сейчас!`
      replyMarkup = {
        inline_keyboard: [[
          { 
            text: '💪 Начать тренировку', 
            web_app: { url: process.env.NEXT_PUBLIC_APP_URL! }
          }
        ]]
      }
    } else {
      messageText = `📊 <b>Ваша статистика</b>

🏋️ <b>Всего тренировок:</b> ${stats.total_workouts}
💪 <b>Всего отжиманий:</b> ${stats.total_reps}
📈 <b>Среднее за тренировку:</b> ${Math.round(stats.avg_reps_per_workout || 0)}
🏆 <b>Личный рекорд:</b> ${stats.personal_best_reps || 0} отжиманий
🔥 <b>Текущая серия:</b> ${stats.current_streak || 0} ${getDaysWord(stats.current_streak || 0)}
⚡ <b>Лучшая серия:</b> ${stats.max_streak || 0} ${getDaysWord(stats.max_streak || 0)}

Откройте приложение для подробной статистики:`
      
      replyMarkup = {
        inline_keyboard: [[
          { 
            text: '📈 Подробная статистика', 
            web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/stats` }
          }
        ]]
      }
    }
    
    console.log(`[handleStatsCommand] Sending message after ${Date.now() - startTime}ms`)
    
    await sendTelegramMessage(chatId, messageText, {
      reply_markup: replyMarkup,
      parse_mode: 'HTML'
    })
    
    console.log(`[handleStatsCommand] Completed in ${Date.now() - startTime}ms`)
  } catch (error) {
    console.error(`[handleStatsCommand] Error after ${Date.now() - startTime}ms:`, error)
    await sendTelegramMessage(
      chatId,
      '❌ Произошла ошибка при загрузке статистики. Попробуйте позже.'
    )
  }
}

// Edge-совместимый обработчик команды /settings
async function handleSettingsCommand(chatId: number, userId: number) {
  const startTime = Date.now()
  console.log(`[handleSettingsCommand] Starting for user ${userId}`)
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const response = await fetch(`${supabaseUrl}/rest/v1/reminder_settings?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`[handleSettingsCommand] Supabase responded in ${Date.now() - startTime}ms`)
    
    const data = await response.json()
    const settings = data?.[0] || {
      days_of_week: [1, 3, 5],
      reminder_time: '09:00:00',
      timezone: 'Europe/Moscow',
      enabled: true
    }
    
    const daysText = formatDaysOfWeek(settings.days_of_week || [1, 3, 5])
    const timeText = formatTime(settings.reminder_time || '09:00:00')
    
    const settingsText = `⚙️ <b>Настройки напоминаний</b>

🗓️ <b>Дни:</b> ${daysText}
⏰ <b>Время:</b> ${timeText}
🌍 <b>Часовой пояс:</b> ${settings.timezone}
🔔 <b>Включены:</b> ${settings.enabled ? '✅ Да' : '❌ Нет'}

Для изменения настроек откройте приложение:`
    
    const replyMarkup = {
      inline_keyboard: [[
        { 
          text: '⚙️ Изменить настройки', 
          web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/settings` }
        }
      ]]
    }
    
    console.log(`[handleSettingsCommand] Sending message after ${Date.now() - startTime}ms`)
    
    await sendTelegramMessage(chatId, settingsText, {
      reply_markup: replyMarkup,
      parse_mode: 'HTML'
    })
    
    console.log(`[handleSettingsCommand] Completed in ${Date.now() - startTime}ms`)
  } catch (error) {
    console.error(`[handleSettingsCommand] Error after ${Date.now() - startTime}ms:`, error)
    await sendTelegramMessage(
      chatId,
      '❌ Произошла ошибка при загрузке настроек. Попробуйте позже.'
    )
  }
}

// Вспомогательные функции
function getDaysWord(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней'
  }

  if (lastDigit === 1) {
    return 'день'
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня'
  }

  return 'дней'
}

function formatDaysOfWeek(days: number[]): string {
  const dayNames = {
    1: 'Пн',
    2: 'Вт', 
    3: 'Ср',
    4: 'Чт',
    5: 'Пт',
    6: 'Сб',
    0: 'Вс'
  }
  
  return days.map(d => dayNames[d as keyof typeof dayNames] || d).join(', ')
}

function formatTime(time: string): string {
  return time.slice(0, 5) // Отсекаем секунды, оставляем HH:MM
}