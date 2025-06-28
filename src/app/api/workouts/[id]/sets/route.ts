import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/telegram'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/workouts/[id]/sets - Получить подходы тренировки
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const { data, error } = await supabaseAdmin
    .from('sets')
    .select('*')
    .eq('workout_id', params.id)
    .order('set_number', { ascending: true })
  
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({ sets: data })
}

// POST /api/workouts/[id]/sets - Добавить новый подход
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromRequest(request)
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { reps, rest_seconds } = body
    
    if (!reps || reps <= 0) {
      return NextResponse.json(
        { error: 'reps is required and must be positive' },
        { status: 400 }
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

    // Получаем следующий номер подхода
    const { data: lastSet } = await supabaseAdmin
      .from('sets')
      .select('set_number')
      .eq('workout_id', params.id)
      .order('set_number', { ascending: false })
      .limit(1)
      .single()
    
    const nextSetNumber = lastSet ? lastSet.set_number + 1 : 1

    // Создаем новый подход
    const { data, error } = await supabaseAdmin
      .from('sets')
      .insert({
        workout_id: params.id,
        set_number: nextSetNumber,
        reps,
        rest_seconds: rest_seconds || 0
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Обновляем статистику тренировки
    const { data: allSets } = await supabaseAdmin
      .from('sets')
      .select('reps')
      .eq('workout_id', params.id)
    
    const totalReps = allSets?.reduce((sum, set) => sum + set.reps, 0) || 0
    const totalSets = allSets?.length || 0

    await supabaseAdmin
      .from('workouts')
      .update({
        total_reps: totalReps,
        total_sets: totalSets
      })
      .eq('id', params.id)
    
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }
}