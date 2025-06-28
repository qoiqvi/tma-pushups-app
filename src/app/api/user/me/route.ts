import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/telegram'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Middleware уже проверил аутентификацию, просто получаем пользователя
  const telegramUser = getUserFromRequest(request)
  
  if (!telegramUser) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    )
  }
  
  // Получаем или создаем пользователя в БД
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('telegram_id', telegramUser.id)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    )
  }
  
  // Если пользователь не найден, создаем его
  if (!user) {
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        language_code: telegramUser.language_code || 'ru',
        is_premium: telegramUser.is_premium || false
      })
      .select()
      .single()
    
    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(newUser)
  }
  
  // Обновляем данные пользователя, если они изменились
  const { data: updatedUser } = await supabaseAdmin
    .from('users')
    .update({
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      is_premium: telegramUser.is_premium || false
    })
    .eq('telegram_id', telegramUser.id)
    .select()
    .single()
  
  return NextResponse.json(updatedUser || user)
}