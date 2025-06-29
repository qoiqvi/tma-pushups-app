import { telegramBot } from './telegram'
import { supabaseAdmin } from '@/lib/supabase/server'
import { BotUpdate, BotMessage, BotUser, BotInlineKeyboardMarkup } from '@/types/bot'
import { formatDaysOfWeek, formatTime } from './utils'

// Главный обработчик обновлений от Telegram
export async function handleBotUpdate(update: BotUpdate) {
  try {
    if (update.message) {
      await handleMessage(update.message)
    } else if (update.callback_query) {
      // Можно добавить обработку callback кнопок в будущем
      console.log('Callback query:', update.callback_query)
    }
  } catch (error) {
    console.error('Error in handleBotUpdate:', error)
  }
}

// Обработчик сообщений
async function handleMessage(message: BotMessage) {
  const chatId = message.chat.id
  const text = message.text
  const user = message.from

  // Создаем/обновляем пользователя в БД (неблокирующе)
  upsertUser(user)

  // Обработка команд
  if (text?.startsWith('/')) {
    await handleCommand(chatId, text, user)
  }
}

// Создание или обновление пользователя (неблокирующее)
function upsertUser(user: BotUser) {
  // Запускаем в фоне, не ждем результата
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
    }, {
      onConflict: 'telegram_id'
    })
    .then(({ error }) => {
      if (error) {
        console.error('Error upserting user:', error)
      }
    })
    // .catch((error: any) => {
    //   console.error('Error in upsertUser:', error)
    // })
}

// Обработчик команд
async function handleCommand(chatId: number, command: string, user: BotUser) {
  const [cmd] = command.split(' ')

  switch (cmd) {
    case '/start':
      await handleStartCommand(chatId, user)
      break
    case '/settings':
      await handleSettingsCommand(chatId, user.id)
      break
    case '/stats':
      await handleStatsCommand(chatId, user.id)
      break
    case '/help':
      await handleHelpCommand(chatId)
      break
    default:
      await telegramBot.sendMessage(
        chatId, 
        '❓ Неизвестная команда. Используйте /help для списка доступных команд.'
      )
  }
}

// Команда /start (оптимизированная)
async function handleStartCommand(chatId: number, user: BotUser) {
  const welcomeText = `🏋️ Добро пожаловать в <b>Pushups Tracker</b>, ${user.first_name}!

Этот бот поможет вам отслеживать тренировки отжиманий и напомнит о них в нужное время.

<b>Команды:</b> /settings /stats /help

Откройте приложение для тренировки:`

  try {
    await telegramBot.sendMessage(chatId, welcomeText, {
      reply_markup: {
        inline_keyboard: [[
          { 
            text: '🚀 Открыть приложение', 
            web_app: { url: process.env.NEXT_PUBLIC_APP_URL! }
          }
        ]]
      },
      parse_mode: 'HTML'
    })
  } catch (error) {
    console.error('Error in handleStartCommand:', error)
    // Fallback - простое сообщение
    try {
      await telegramBot.sendMessage(chatId, `🏋️ Добро пожаловать, ${user.first_name}! Используйте /help для справки.`)
    } catch (fallbackError) {
      console.error('Fallback message failed:', fallbackError)
    }
  }
}

// Команда /settings
async function handleSettingsCommand(chatId: number, userId: number) {
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

    const daysText = formatDaysOfWeek(currentSettings.days_of_week || [1, 3, 5])
    const timeText = formatTime(currentSettings.reminder_time || '09:00:00')

    const settingsText = `
⚙️ <b>Настройки напоминаний</b>

🗓️ <b>Дни:</b> ${daysText}
⏰ <b>Время:</b> ${timeText}
🌍 <b>Часовой пояс:</b> ${currentSettings.timezone}
🔔 <b>Включены:</b> ${currentSettings.enabled ? '✅ Да' : '❌ Нет'}

Для изменения настроек откройте приложение:
`

    const keyboard: BotInlineKeyboardMarkup = {
      inline_keyboard: [[
        { 
          text: '⚙️ Изменить настройки', 
          web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/settings` }
        }
      ]]
    }

    await telegramBot.sendMessage(chatId, settingsText, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    })
  } catch (error) {
    console.error('Error in handleSettingsCommand:', error)
    await telegramBot.sendMessage(
      chatId,
      '❌ Произошла ошибка при загрузке настроек. Попробуйте позже.'
    )
  }
}

// Команда /stats
async function handleStatsCommand(chatId: number, userId: number) {
  try {
    // Получаем статистику пользователя
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!stats || stats.total_workouts === 0) {
      const noStatsText = `
📊 <b>Ваша статистика</b>

У вас пока нет тренировок. Начните свою первую тренировку прямо сейчас!
`
      const keyboard: BotInlineKeyboardMarkup = {
        inline_keyboard: [[
          { 
            text: '💪 Начать тренировку', 
            web_app: { url: process.env.NEXT_PUBLIC_APP_URL! }
          }
        ]]
      }

      await telegramBot.sendMessage(chatId, noStatsText, {
        reply_markup: keyboard,
        parse_mode: 'HTML'
      })
      return
    }

    // Форматируем статистику
    const statsText = `
📊 <b>Ваша статистика</b>

🏋️ <b>Всего тренировок:</b> ${stats.total_workouts}
💪 <b>Всего отжиманий:</b> ${stats.total_reps}
📈 <b>Среднее за тренировку:</b> ${Math.round(stats.avg_reps_per_workout || 0)}
🏆 <b>Личный рекорд:</b> ${stats.personal_best_reps || 0} отжиманий
🔥 <b>Текущая серия:</b> ${stats.current_streak || 0} ${getDaysWord(stats.current_streak || 0)}
⚡ <b>Лучшая серия:</b> ${stats.max_streak || 0} ${getDaysWord(stats.max_streak || 0)}

Откройте приложение для подробной статистики:
`

    const keyboard: BotInlineKeyboardMarkup = {
      inline_keyboard: [[
        { 
          text: '📈 Подробная статистика', 
          web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/stats` }
        }
      ]]
    }

    await telegramBot.sendMessage(chatId, statsText, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    })
  } catch (error) {
    console.error('Error in handleStatsCommand:', error)
    await telegramBot.sendMessage(
      chatId,
      '❌ Произошла ошибка при загрузке статистики. Попробуйте позже.'
    )
  }
}

// Команда /help
async function handleHelpCommand(chatId: number) {
  const helpText = `
❓ <b>Помощь</b>

<b>Доступные команды:</b>
/start - Приветствие и запуск бота
/settings - Просмотр настроек напоминаний
/stats - Ваша статистика тренировок
/help - Эта справка

<b>Как использовать бот:</b>
1. Настройте напоминания через /settings
2. Получайте уведомления в выбранное время
3. Открывайте приложение для тренировки
4. Отслеживайте прогресс через /stats

<b>Совет:</b> Регулярные тренировки - ключ к успеху! 💪
`

  await telegramBot.sendMessage(chatId, helpText, {
    parse_mode: 'HTML'
  })
}

// Вспомогательная функция для склонения слова "день"
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