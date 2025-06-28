import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/telegram'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/workouts/[id]/photos - Получить фотографии тренировки
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const userId = getUserIdFromRequest(request)
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    )
  }

  // Проверяем, что тренировка принадлежит пользователю
  const { data: workout, error: workoutError } = await supabaseAdmin
    .from('workouts')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()
  
  if (workoutError || !workout) {
    return NextResponse.json(
      { error: 'Workout not found' },
      { status: 404 }
    )
  }

  // Получаем все фотографии тренировки
  const { data: photos, error } = await supabaseAdmin
    .from('workout_photos')
    .select('*')
    .eq('workout_id', params.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({ photos })
}