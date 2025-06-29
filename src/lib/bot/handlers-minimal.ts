import { BotUpdate } from '@/types/bot'

// Минималистичный Edge-совместимый обработчик - только /start
export async function handleBotUpdateMinimal(update: BotUpdate) {
  const startTime = Date.now()
  
  if (!update.message?.text || update.message.text !== '/start') {
    console.log(`[${Date.now() - startTime}ms] Ignoring non-/start message: ${update.message?.text || 'no text'}`)
    return // Игнорируем все, кроме /start
  }
  
  const chatId = update.message.chat.id
  const firstName = update.message.from.first_name
  
  console.log(`[${Date.now() - startTime}ms] Processing /start for user ${chatId}`)
  
  const welcomeText = `🏋️ Добро пожаловать в <b>Pushups Tracker</b>, ${firstName}!

Отслеживайте свои тренировки отжиманий и следите за прогрессом.

Нажмите кнопку ниже, чтобы начать:`
  
  try {
    console.log(`[${Date.now() - startTime}ms] Sending message to Telegram API`)
    
    // Прямой HTTP запрос к Telegram API
    const response = await fetch(
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
    
    const result = await response.json()
    console.log(`[${Date.now() - startTime}ms] Telegram API response:`, result.ok ? 'Success' : 'Failed', result.error_code || '')
    
    if (!result.ok) {
      console.error(`[${Date.now() - startTime}ms] Telegram API error:`, result)
    }
    
    console.log(`[${Date.now() - startTime}ms] /start processing completed`)
  } catch (error) {
    console.error(`[${Date.now() - startTime}ms] Error sending message:`, error)
    throw error // Перебрасываем ошибку для webhook
  }
}