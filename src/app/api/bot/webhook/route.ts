import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  // Проверяем подпись Telegram
  const headerToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  if (headerToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update = await request.json()
    
    // Сразу отвечаем Telegram
    const response = NextResponse.json({ ok: true })
    
    // Обрабатываем в фоне
    handleUpdateFast(update, startTime).catch(error => {
      console.error('Background processing error:', error)
    })
    
    return response
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Быстрая обработка команд без библиотек
async function handleUpdateFast(update: any, startTime: number) {
  const message = update.message
  if (!message) return
  
  const chatId = message.chat.id
  const text = message.text
  const user = message.from
  
  // Сохраняем пользователя неблокирующе
  if (user) {
    supabaseAdmin
      .from('users')
      .upsert({
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.first_name,
        last_name: user.last_name || null,
        language_code: user.language_code || 'ru',
        is_premium: user.is_premium || false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'telegram_id' })
      .then(({ error }) => {
        if (error) console.error('User upsert error:', error)
      })
  }
  
  // Обрабатываем команды
  if (text?.startsWith('/')) {
    await handleCommandFast(chatId, text, user, startTime)
  }
}

// Быстрые команды через прямой API
async function handleCommandFast(chatId: number, command: string, user: any, startTime: number) {
  const [cmd] = command.split(' ')
  const botToken = process.env.TELEGRAM_BOT_TOKEN!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  
  let responseText = ''
  let keyboard = null
  
  switch (cmd) {
    case '/start':
      responseText = `🏋️ Добро пожаловать в <b>Pushups Tracker</b>, ${user.first_name}!

Этот бот поможет отслеживать тренировки отжиманий и напомнит о них в нужное время.

<b>Команды:</b> /settings /stats /help

Откройте приложение для тренировки:`
      
      keyboard = {
        inline_keyboard: [[
          { text: '🚀 Открыть приложение', web_app: { url: appUrl } }
        ]]
      }
      break
      
    case '/help':
      responseText = `❓ <b>Помощь</b>

<b>Команды:</b>
/start - Приветствие и запуск
/settings - Настройки напоминаний  
/stats - Статистика тренировок
/help - Эта справка

<b>Использование:</b>
1. Настройте напоминания через /settings
2. Получайте уведомления в выбранное время
3. Открывайте приложение для тренировки
4. Отслеживайте прогресс через /stats

<b>Совет:</b> Регулярные тренировки - ключ к успеху! 💪`
      break
      
    case '/settings':
      await handleSettingsFast(chatId, user.id, botToken, appUrl)
      return
      
    case '/stats':
      await handleStatsFast(chatId, user.id, botToken, appUrl)
      return
      
    default:
      responseText = '❓ Неизвестная команда. Используйте /help для справки.'
  }
  
  if (responseText) {
    const payload: any = {
      chat_id: chatId,
      text: responseText,
      parse_mode: 'HTML'
    }
    
    if (keyboard) {
      payload.reply_markup = keyboard
    }
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      console.error('Telegram API error:', await response.text())
    } else {
      console.log(`Command ${cmd} processed in ${Date.now() - startTime}ms`)
    }
  }
}

async function handleSettingsFast(chatId: number, userId: number, botToken: string, appUrl: string) {
  try {
    const { data: settings } = await supabaseAdmin
      .from('reminder_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    const currentSettings = settings || {
      days_of_week: [1, 3, 5],
      reminder_time: '09:00:00',
      timezone: 'Europe/Moscow',
      enabled: true
    }

    const daysText = (currentSettings.days_of_week || [1, 3, 5])
      .map((day: number) => ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][day])
      .join(', ')

    const settingsText = `⚙️ <b>Настройки напоминаний</b>

🗓️ <b>Дни:</b> ${daysText}
⏰ <b>Время:</b> ${(currentSettings.reminder_time || '09:00:00').slice(0, 5)}
🌍 <b>Часовой пояс:</b> ${currentSettings.timezone || 'Europe/Moscow'}
🔔 <b>Включены:</b> ${currentSettings.enabled ? '✅ Да' : '❌ Нет'}

Для изменения настроек откройте приложение:`

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: settingsText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '⚙️ Изменить настройки', web_app: { url: `${appUrl}/settings` } }
          ]]
        }
      })
    })
  } catch (error) {
    console.error('Settings command error:', error)
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '❌ Произошла ошибка при загрузке настроек. Попробуйте позже.'
      })
    })
  }
}

async function handleStatsFast(chatId: number, userId: number, botToken: string, appUrl: string) {
  try {
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!stats || (stats.total_workouts || 0) === 0) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `📊 <b>Ваша статистика</b>

У вас пока нет тренировок. Начните свою первую тренировку прямо сейчас!`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '💪 Начать тренировку', web_app: { url: appUrl } }
            ]]
          }
        })
      })
      return
    }

    const statsText = `📊 <b>Ваша статистика</b>

🏋️ <b>Всего тренировок:</b> ${stats.total_workouts || 0}
💪 <b>Всего отжиманий:</b> ${stats.total_reps || 0}
📈 <b>Среднее за тренировку:</b> ${Math.round(stats.avg_reps_per_workout || 0)}
🏆 <b>Личный рекорд:</b> ${stats.personal_best_reps || 0} отжиманий
🔥 <b>Текущая серия:</b> ${stats.current_streak || 0} ${getDaysWord(stats.current_streak || 0)}
⚡ <b>Лучшая серия:</b> ${stats.max_streak || 0} ${getDaysWord(stats.max_streak || 0)}

Откройте приложение для подробной статистики:`

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: statsText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '📈 Подробная статистика', web_app: { url: `${appUrl}/stats` } }
          ]]
        }
      })
    })
  } catch (error) {
    console.error('Stats command error:', error)
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '❌ Произошла ошибка при загрузке статистики. Попробуйте позже.'
      })
    })
  }
}

function getDaysWord(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'дней'
  if (lastDigit === 1) return 'день'
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня'
  return 'дней'
}

// GET endpoint для проверки работоспособности
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    webhook: '/api/bot/webhook',
    message: 'Fast Telegram Bot webhook endpoint is ready'
  })
}