import TelegramBot from 'node-telegram-bot-api'

// Создаем экземпляр бота для отправки сообщений
// Webhook будет обрабатываться через API routes
export const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  webHook: false // Не используем встроенный webhook
})

// Функция для установки webhook URL
export async function setWebhook() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/bot/webhook`
  
  try {
    const result = await telegramBot.setWebHook(webhookUrl, {
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET
    })
    
    console.log('Webhook set:', result ? 'Success' : 'Failed')
    return result
  } catch (error) {
    console.error('Error setting webhook:', error)
    return false
  }
}

// Функция для удаления webhook
export async function deleteWebhook() {
  try {
    const result = await telegramBot.deleteWebHook()
    console.log('Webhook deleted:', result ? 'Success' : 'Failed')
    return result
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return false
  }
}

// Функция для получения информации о webhook
export async function getWebhookInfo() {
  try {
    const info = await telegramBot.getWebHookInfo()
    return info
  } catch (error) {
    console.error('Error getting webhook info:', error)
    return null
  }
}