import { NextResponse } from 'next/server'

// Этот endpoint работает на сервере и может видеть ВСЕ переменные
export async function GET() {
  return NextResponse.json({
    server_env: {
      NODE_ENV: process.env.NODE_ENV,
      // Публичные переменные
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET',
      // Серверные переменные
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ NOT SET',
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? '✅ SET' : '❌ NOT SET',
      CRON_SECRET: process.env.CRON_SECRET ? '✅ SET' : '❌ NOT SET',
      // Vercel переменные
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    }
  })
}