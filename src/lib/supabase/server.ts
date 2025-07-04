import { createClient } from '@supabase/supabase-js'
import { Database } from '../database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

// ВРЕМЕННОЕ РЕШЕНИЕ: Если service role key не установлен, используем anon key
// Это не безопасно для production, но позволит приложению работать
const supabaseKey = supabaseServiceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseKey) {
  throw new Error('Missing Supabase keys - neither SERVICE_ROLE_KEY nor ANON_KEY are set')
}

// Предупреждение если используется anon key
if (!supabaseServiceRoleKey && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: Using anon key instead of service role key in production!')
}

// Серверный клиент с service_role ключом для полного доступа
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)