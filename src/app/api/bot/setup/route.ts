import { NextRequest, NextResponse } from 'next/server'
import { setWebhook, getWebhookInfo, deleteWebhook } from '@/lib/bot/telegram'

// GET /api/bot/setup - Получить информацию о webhook
export async function GET(request: NextRequest) {
  try {
    const info = await getWebhookInfo()
    
    return NextResponse.json({
      status: 'ok',
      webhook_info: info,
      current_url: info?.url || 'Not set',
      pending_updates: info?.pending_update_count || 0,
      last_error: info?.last_error_message || null
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get webhook info',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/bot/setup - Установить webhook
export async function POST(request: NextRequest) {
  // Простая защита endpoint'а
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await setWebhook()
    
    if (result) {
      // Получаем информацию для подтверждения
      const info = await getWebhookInfo()
      
      return NextResponse.json({
        success: true,
        message: 'Webhook set successfully',
        webhook_url: info?.url,
        info
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to set webhook'
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to set webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/bot/setup - Удалить webhook
export async function DELETE(request: NextRequest) {
  // Простая защита endpoint'а
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await deleteWebhook()
    
    return NextResponse.json({
      success: result,
      message: result ? 'Webhook deleted successfully' : 'Failed to delete webhook'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to delete webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}