import { NextRequest, NextResponse } from 'next/server'
import { telegramBot } from '@/lib/bot/telegram'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const logs: string[] = []
  
  logs.push(`[${new Date().toISOString()}] Debug endpoint called`)
  
  try {
    // 1. Test Telegram API
    logs.push(`[${Date.now() - startTime}ms] Testing Telegram API...`)
    const botInfo = await telegramBot.getMe()
    logs.push(`[${Date.now() - startTime}ms] Bot info: @${botInfo.username}`)
    
    // 2. Test Supabase connection
    logs.push(`[${Date.now() - startTime}ms] Testing Supabase connection...`)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      logs.push(`[${Date.now() - startTime}ms] Supabase error: ${error.message}`)
    } else {
      logs.push(`[${Date.now() - startTime}ms] Supabase connected successfully`)
    }
    
    // 3. Test sending message (if chat_id provided)
    const { chat_id } = await request.json().catch(() => ({ chat_id: null }))
    
    if (chat_id) {
      logs.push(`[${Date.now() - startTime}ms] Sending test message to ${chat_id}...`)
      const messageStart = Date.now()
      
      await telegramBot.sendMessage(chat_id, `🔧 Debug test at ${new Date().toISOString()}\n\nResponse time: ${Date.now() - startTime}ms`)
      
      logs.push(`[${Date.now() - startTime}ms] Message sent in ${Date.now() - messageStart}ms`)
    }
    
    logs.push(`[${Date.now() - startTime}ms] Total execution time`)
    
    return NextResponse.json({
      success: true,
      executionTime: `${Date.now() - startTime}ms`,
      logs
    })
  } catch (error) {
    logs.push(`[${Date.now() - startTime}ms] ERROR: ${error}`)
    
    return NextResponse.json({
      success: false,
      executionTime: `${Date.now() - startTime}ms`,
      error: String(error),
      logs
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Debug endpoint ready',
    usage: 'POST with optional { chat_id: number } to test'
  })
}