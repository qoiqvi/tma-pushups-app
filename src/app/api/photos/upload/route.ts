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
    const formData = await request.formData()
    const file = formData.get('file') as File
    const workoutId = formData.get('workoutId') as string
    
    if (!file || !workoutId) {
      return NextResponse.json(
        { error: 'File and workoutId are required' },
        { status: 400 }
      )
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Проверяем размер файла (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Проверяем, что тренировка принадлежит пользователю
    const { data: workout, error: workoutError } = await supabaseAdmin
      .from('workouts')
      .select('id')
      .eq('id', workoutId)
      .eq('user_id', userId)
      .single()
    
    if (workoutError || !workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    // Генерируем уникальное имя файла
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}/${workoutId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    
    // Конвертируем File в ArrayBuffer для Supabase
    const arrayBuffer = await file.arrayBuffer()
    const fileData = new Uint8Array(arrayBuffer)

    // Загружаем в Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('workout-photos')
      .upload(fileName, fileData, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('workout-photos')
      .getPublicUrl(fileName)

    // Создаем запись о фото в БД
    const { data: photo, error: dbError } = await supabaseAdmin
      .from('workout_photos')
      .insert({
        workout_id: workoutId,
        original_url: publicUrl,
        processing_status: 'pending'
      })
      .select()
      .single()
    
    if (dbError) {
      // Удаляем загруженный файл в случае ошибки БД
      await supabaseAdmin.storage
        .from('workout-photos')
        .remove([fileName])
      
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      )
    }

    // Запускаем обработку в фоне
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (request.headers.get('host') ? 
                      `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}` : 
                      'http://localhost:3000')
      
      fetch(`${baseUrl}/api/photos/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photo.id })
      }).catch(err => console.error('Background processing failed:', err))
    } catch (err) {
      console.error('Failed to start background processing:', err)
    }
    
    return NextResponse.json(photo, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}