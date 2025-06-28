import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/telegram'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/photos/upload - Загрузить фото тренировки
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { workout_id, original_url } = body
    
    if (!workout_id || !original_url) {
      return NextResponse.json(
        { error: 'workout_id and original_url are required' },
        { status: 400 }
      )
    }

    // Проверяем, что тренировка принадлежит пользователю
    const { data: workout, error: workoutError } = await supabaseAdmin
      .from('workouts')
      .select('id')
      .eq('id', workout_id)
      .eq('user_id', userId)
      .single()
    
    if (workoutError || !workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    // Создаем запись о фото
    const { data, error } = await supabaseAdmin
      .from('workout_photos')
      .insert({
        workout_id,
        original_url,
        processing_status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // TODO: Здесь можно добавить логику загрузки в облачное хранилище
    // и постановку задачи на обработку фото
    
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }
}