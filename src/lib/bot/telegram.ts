// Минимальная конфигурация для установки webhook
export async function setWebhook() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/bot/webhook`
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: process.env.TELEGRAM_WEBHOOK_SECRET
        })
      }
    )
    
    const result = await response.json()
    console.log('Webhook set:', result.ok ? 'Success' : 'Failed')
    return result.ok
  } catch (error) {
    console.error('Error setting webhook:', error)
    return false
  }
}

export async function deleteWebhook() {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/deleteWebhook`
    )
    const result = await response.json()
    return result.ok
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return false
  }
}

export async function getWebhookInfo() {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    )
    return await response.json()
  } catch (error) {
    console.error('Error getting webhook info:', error)
    return null
  }
}