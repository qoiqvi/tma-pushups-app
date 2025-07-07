import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, isAuthError } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/photos - Получить все фотографии пользователя
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  
  if (isAuthError(authResult)) {
    return authResult.error
  }
  
  const userId = authResult.user.id

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const status = searchParams.get('status') // pending, processing, completed, failed

  let query = supabaseAdmin
    .from('workout_photos')
    .select(`
      *,
      workouts (
        id,
        started_at,
        total_reps,
        total_sets,
        duration_seconds
      )
    `)
    .eq('workouts.user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Фильтр по статусу обработки
  if (status) {
    query = query.eq('processing_status', status)
  }

  const { data: photos, error, count } = await query
  
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({
    photos,
    total: count,
    offset,
    limit
  })
}