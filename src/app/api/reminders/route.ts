import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, isAuthError } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/reminders - Получить настройки напоминаний
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  
  if (isAuthError(authResult)) {
    return authResult.error
  }
  
  const userId = authResult.user.id

  let { data: settings, error } = await supabaseAdmin
    .from('reminder_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // Если настроек нет, создаем дефолтные
    const { data: newSettings, error: createError } = await supabaseAdmin
      .from('reminder_settings')
      .insert({
        user_id: userId,
        days_of_week: [1, 3, 5], // Понедельник, среда, пятница
        reminder_time: '09:00:00',
        timezone: 'Europe/Moscow',
        enabled: true
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      )
    }
    settings = newSettings
  } else if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(settings)
}

// PUT /api/reminders - Обновить настройки напоминаний
export async function PUT(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  
  if (isAuthError(authResult)) {
    return authResult.error
  }
  
  const userId = authResult.user.id

  try {
    const body = await request.json()
    const { days_of_week, reminder_time, timezone, enabled } = body
    
    // Валидация дней недели (1-7, где 1 = понедельник)
    if (days_of_week && (!Array.isArray(days_of_week) || 
        !days_of_week.every(day => day >= 1 && day <= 7))) {
      return NextResponse.json(
        { error: 'days_of_week must be array of numbers 1-7' },
        { status: 400 }
      )
    }
    
    // Валидация времени (HH:MM:SS формат)
    if (reminder_time && !/^\d{2}:\d{2}:\d{2}$/.test(reminder_time)) {
      return NextResponse.json(
        { error: 'reminder_time must be in HH:MM:SS format' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (days_of_week !== undefined) updateData.days_of_week = days_of_week
    if (reminder_time !== undefined) updateData.reminder_time = reminder_time
    if (timezone !== undefined) updateData.timezone = timezone
    if (enabled !== undefined) updateData.enabled = enabled

    // Проверяем, существуют ли настройки
    const { data: existingSettings } = await supabaseAdmin
      .from('reminder_settings')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    let data, error

    if (existingSettings) {
      // Обновляем существующие настройки
      const result = await supabaseAdmin
        .from('reminder_settings')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Создаем новые настройки с дефолтными значениями
      const result = await supabaseAdmin
        .from('reminder_settings')
        .insert({
          user_id: userId,
          days_of_week: days_of_week || [1, 3, 5],
          reminder_time: reminder_time || '09:00:00',
          timezone: timezone || 'Europe/Moscow',
          enabled: enabled !== undefined ? enabled : true
        })
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }
}