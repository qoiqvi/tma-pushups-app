import { NextRequest, NextResponse } from 'next/server'
import { sendReminders } from '@/lib/bot/reminders'

export async function POST(request: NextRequest) {
  // Проверяем авторизацию (GitHub Actions или другой cron сервис)
  const authHeader = request.headers.get('Authorization')
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`
  
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Starting reminder job...')
    const result = await sendReminders()
    console.log('Reminder job completed:', result)
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Reminders error:', error)
    return NextResponse.json({ 
      error: 'Failed to send reminders',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint для ручного тестирования (только в development)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/bot/reminders',
    message: 'Use POST with Authorization header to trigger reminders',
    test_command: `curl -X POST http://localhost:3000/api/bot/reminders -H "Authorization: Bearer ${process.env.CRON_SECRET}"`
  })
}