import { format, utcToZonedTime } from 'date-fns-tz'
import { telegramBot } from './telegram'
import { supabaseAdmin } from '@/lib/supabase/server'
import { BotInlineKeyboardMarkup } from '@/types/bot'

export async function sendReminders() {
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  console.log(`Checking reminders for day ${currentDay} at ${now.toISOString()}`)
  
  // Получаем все активные настройки напоминаний для текущего дня
  const { data: settings, error } = await supabaseAdmin
    .from('reminder_settings')
    .select(`
      *,
      users (
        telegram_id,
        first_name,
        username
      )
    `)
    .eq('enabled', true)
    .contains('days_of_week', [currentDay])

  if (error) {
    console.error('Error fetching reminder settings:', error)
    return { sent: 0, errors: 1, error: error.message }
  }

  if (!settings || settings.length === 0) {
    console.log('No reminders to send for today')
    return { sent: 0, errors: 0, total: 0 }
  }

  console.log(`Found ${settings.length} potential reminders`)

  let sent = 0
  let errors = 0
  const sendResults: Array<{ userId: number; status: string; time?: string }> = []

  for (const setting of settings) {
    try {
      // Проверяем время с учетом часового пояса пользователя
      const userTime = utcToZonedTime(now, setting.timezone || 'Europe/Moscow')
      const userTimeString = format(userTime, 'HH:mm')
      const reminderTime = setting.reminder_time.slice(0, 5)

      console.log(`User ${setting.user_id}: ${userTimeString} vs ${reminderTime} (${setting.timezone})`)

      // Проверяем совпадение времени с допуском ±5 минут
      if (isTimeMatch(userTimeString, reminderTime)) {
        // Проверяем, не отправляли ли уже сегодня
        const today = format(now, 'yyyy-MM-dd')
        
        if (setting.last_sent_at === today) {
          console.log(`Already sent today to user ${setting.user_id}`)
          continue
        }

        // Отправляем напоминание
        const success = await sendReminderMessage(
          setting.user_id,
          setting.users?.first_name || null
        )
        
        if (success) {
          // Обновляем last_sent_at
          const { error: updateError } = await supabaseAdmin
            .from('reminder_settings')
            .update({ last_sent_at: today })
            .eq('user_id', setting.user_id)

          if (updateError) {
            console.error(`Failed to update last_sent_at for user ${setting.user_id}:`, updateError)
          }

          sent++
          sendResults.push({ 
            userId: setting.user_id, 
            status: 'sent',
            time: userTimeString
          })
        } else {
          errors++
          sendResults.push({ 
            userId: setting.user_id, 
            status: 'failed'
          })
        }
      }
    } catch (err) {
      console.error(`Failed to process reminder for user ${setting.user_id}:`, err)
      errors++
      sendResults.push({ 
        userId: setting.user_id, 
        status: 'error'
      })
    }
  }

  return { 
    sent, 
    errors, 
    total: settings.length,
    results: sendResults
  }
}

// Проверка совпадения времени с допуском ±5 минут
function isTimeMatch(currentTime: string, targetTime: string): boolean {
  const [currentHour, currentMin] = currentTime.split(':').map(Number)
  const [targetHour, targetMin] = targetTime.split(':').map(Number)
  
  const currentMinutes = currentHour * 60 + currentMin
  const targetMinutes = targetHour * 60 + targetMin
  
  // Допуск ±5 минут
  const difference = Math.abs(currentMinutes - targetMinutes)
  return difference <= 5
}

// Отправка напоминания пользователю
async function sendReminderMessage(
  userId: number, 
  firstName: string | null
): Promise<boolean> {
  const name = firstName ? `, ${firstName}` : ''
  
  // Получаем статистику пользователя для мотивации
  const { data: stats } = await supabaseAdmin
    .from('user_stats')
    .select('current_streak, total_workouts')
    .eq('user_id', userId)
    .single()

  let motivationText = ''
  if (stats) {
    if (stats.current_streak > 0) {
      motivationText = `\n\n🔥 Ваша текущая серия: ${stats.current_streak} ${getDaysWord(stats.current_streak)}. Не прерывайте её!`
    } else if (stats.total_workouts > 0) {
      motivationText = '\n\n💫 Время начать новую серию тренировок!'
    }
  }

  const message = `💪 Время для тренировки${name}!

Не забудьте сделать отжимания сегодня. Даже небольшая тренировка лучше, чем никакой!${motivationText}

Откройте приложение, чтобы начать:`

  const keyboard: BotInlineKeyboardMarkup = {
    inline_keyboard: [[
      { 
        text: '🏋️ Начать тренировку', 
        web_app: { url: process.env.NEXT_PUBLIC_APP_URL! }
      }
    ]]
  }

  try {
    await telegramBot.sendMessage(userId, message, {
      reply_markup: keyboard
    })
    console.log(`Reminder sent to user ${userId}`)
    return true
  } catch (error) {
    console.error(`Failed to send reminder to user ${userId}:`, error)
    return false
  }
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