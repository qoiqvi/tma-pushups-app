import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, isAuthError } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { updateUserStats } from '@/lib/stats'

// GET /api/workouts/[id] - Получить конкретную тренировку
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const authResult = await authenticateRequest(request)
  
  if (isAuthError(authResult)) {
    return authResult.error
  }
  
  const userId = authResult.user.id

  const { data, error } = await supabaseAdmin
    .from('workouts')
    .select('*, sets(*)')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json(data)
}

// PUT /api/workouts/[id] - Обновить тренировку
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const authResult = await authenticateRequest(request)
  
  if (isAuthError(authResult)) {
    return authResult.error
  }
  
  const userId = authResult.user.id

  try {
    const body = await request.json()
    const { finished_at, duration_seconds, notes, total_reps, total_sets } = body
    
    // Проверяем, что тренировка принадлежит пользователю
    const { data: existingWorkout, error: checkError } = await supabaseAdmin
      .from('workouts')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()
    
    if (checkError || !existingWorkout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }
    
    const updateData: any = {}
    if (finished_at !== undefined) updateData.finished_at = finished_at
    if (duration_seconds !== undefined) updateData.duration_seconds = duration_seconds
    if (notes !== undefined) updateData.notes = notes
    if (total_reps !== undefined) updateData.total_reps = total_reps
    if (total_sets !== undefined) updateData.total_sets = total_sets
    
    const { data, error } = await supabaseAdmin
      .from('workouts')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Если тренировка была завершена (finished_at), обновляем статистику
    if (finished_at) {
      try {
        await updateUserStats(userId)
      } catch (statsError) {
        console.error('Failed to update user stats:', statsError)
        // Не возвращаем ошибку, так как главная операция успешна
      }
    }
    
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }
}

// DELETE /api/workouts/[id] - Удалить тренировку
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const authResult = await authenticateRequest(request)
  
  if (isAuthError(authResult)) {
    return authResult.error
  }
  
  const userId = authResult.user.id

  const { error } = await supabaseAdmin
    .from('workouts')
    .delete()
    .eq('id', params.id)
    .eq('user_id', userId)
  
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  // Обновляем статистику после удаления тренировки
  try {
    await updateUserStats(userId)
  } catch (statsError) {
    console.error('Failed to update user stats after deletion:', statsError)
    // Не возвращаем ошибку, так как главная операция успешна
  }
  
  return NextResponse.json({ success: true })
}