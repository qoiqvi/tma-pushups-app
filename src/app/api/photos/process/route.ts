import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/photos/process - Обработать фото (webhook для внешнего сервиса)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { photo_id, processed_url, stats_overlay_applied, processing_status } = body
    
    if (!photo_id) {
      return NextResponse.json(
        { error: 'photo_id is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (processed_url) updateData.processed_url = processed_url
    if (stats_overlay_applied !== undefined) updateData.stats_overlay_applied = stats_overlay_applied
    if (processing_status) updateData.processing_status = processing_status

    const { data, error } = await supabaseAdmin
      .from('workout_photos')
      .update(updateData)
      .eq('id', photo_id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, photo: data })
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }
}

// GET /api/photos/process - Получить статус обработки фото
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const photoId = searchParams.get('photo_id')
  
  if (!photoId) {
    return NextResponse.json(
      { error: 'photo_id parameter is required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('workout_photos')
    .select('*')
    .eq('id', photoId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Photo not found' },
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