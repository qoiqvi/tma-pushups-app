import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
      hasCronSecret: !!process.env.CRON_SECRET,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      vercel: process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV
    },
    supabase: {
      connection: 'not tested'
    }
  }

  // Проверяем подключение к Supabase
  try {
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      health.supabase.connection = `ERROR: ${error.message}`
      health.status = 'error'
    } else {
      health.supabase.connection = `OK (${count} users in DB)`
    }
  } catch (e: any) {
    health.supabase.connection = `EXCEPTION: ${e.message}`
    health.status = 'error'
  }

  return NextResponse.json(health)
}