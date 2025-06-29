import { BotUpdate } from '@/types/bot'

// Минималистичный Edge-совместимый обработчик - только /start
export async function handleBotUpdateMinimal(update: BotUpdate) {
  if (!update.message?.text || update.message.text !== '/start') {
    return // Игнорируем все, кроме /start
  }
  
  const chatId = update.message.chat.id
  const firstName = update.message.from.first_name
  
  const welcomeText = `🏋️ Добро пожаловать в <b>Pushups Tracker</b>, ${firstName}!

Отслеживайте свои тренировки отжиманий и следите за прогрессом.

Нажмите кнопку ниже, чтобы начать:`
  
  // Прямой HTTP запрос к Telegram API
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '🚀 Открыть приложение', 
              web_app: { url: process.env.NEXT_PUBLIC_APP_URL! }
            }
          ]]
        }
      })
    }
  )
}