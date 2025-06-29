import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
      hasCronSecret: !!process.env.CRON_SECRET,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    }
  })
}