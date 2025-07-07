import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, isAuthError } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'

// PUT /api/sets/[id] - Обновить подход
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
    const { reps, rest_seconds } = body
    
    if (reps !== undefined && reps <= 0) {
      return NextResponse.json(
        { error: 'reps must be positive' },
        { status: 400 }
      )
    }

    // Проверяем, что подход принадлежит пользователю через workout
    const { data: setData, error: setError } = await supabaseAdmin
      .from('sets')
      .select('workout_id, workouts(user_id)')
      .eq('id', params.id)
      .single()
    
    if (setError || !setData || setData.workouts?.user_id !== userId) {
      return NextResponse.json(
        { error: 'Set not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (reps !== undefined) updateData.reps = reps
    if (rest_seconds !== undefined) updateData.rest_seconds = rest_seconds
    
    const { data, error } = await supabaseAdmin
      .from('sets')
      .update(updateData)
      .eq('id', params.id)
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
      .eq('workout_id', setData.workout_id)
    
    const totalReps = allSets?.reduce((sum, set) => sum + set.reps, 0) || 0

    await supabaseAdmin
      .from('workouts')
      .update({ total_reps: totalReps })
      .eq('id', setData.workout_id)
    
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }
}

// DELETE /api/sets/[id] - Удалить подход
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

  // Проверяем, что подход принадлежит пользователю через workout
  const { data: setData, error: setError } = await supabaseAdmin
    .from('sets')
    .select('workout_id, workouts(user_id)')
    .eq('id', params.id)
    .single()
  
  if (setError || !setData || setData.workouts?.user_id !== userId) {
    return NextResponse.json(
      { error: 'Set not found' },
      { status: 404 }
    )
  }

  const { error } = await supabaseAdmin
    .from('sets')
    .delete()
    .eq('id', params.id)
  
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
    .eq('workout_id', setData.workout_id)
  
  const totalReps = allSets?.reduce((sum, set) => sum + set.reps, 0) || 0
  const totalSets = allSets?.length || 0

  await supabaseAdmin
    .from('workouts')
    .update({
      total_reps: totalReps,
      total_sets: totalSets
    })
    .eq('id', setData.workout_id)
  
  return NextResponse.json({ success: true })
}