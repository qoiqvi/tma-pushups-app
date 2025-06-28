import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/telegram'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/workouts - Получить список тренировок
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const { data, error, count } = await supabaseAdmin
    .from('workouts')
    .select('*, sets(*)', { count: 'exact' })
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({
    workouts: data,
    total: count,
    offset,
    limit
  })
}

// POST /api/workouts - Создать новую тренировку
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
    const { started_at, notes } = body
    
    if (!started_at) {
      return NextResponse.json(
        { error: 'started_at is required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabaseAdmin
      .from('workouts')
      .insert({
        user_id: userId,
        started_at,
        notes: notes || null,
        total_reps: 0,
        total_sets: 0
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }
}