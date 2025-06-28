import { NextRequest, NextResponse } from 'next/server'
import { createCanvas, loadImage } from 'canvas'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/photos/process - Обработать фото с наложением статистики
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { photo_id } = body
    
    if (!photo_id) {
      return NextResponse.json(
        { error: 'photo_id is required' },
        { status: 400 }
      )
    }

    // Получаем данные фото и тренировки
    const { data: photo, error: photoError } = await supabaseAdmin
      .from('workout_photos')
      .select(`
        *,
        workouts (
          *,
          sets (*)
        )
      `)
      .eq('id', photo_id)
      .single()
    
    if (photoError || !photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Обновляем статус на "processing"
    await supabaseAdmin
      .from('workout_photos')
      .update({ processing_status: 'processing' })
      .eq('id', photo_id)

    try {
      // Загружаем оригинальное изображение
      const image = await loadImage(photo.original_url)
      const canvas = createCanvas(image.width, image.height)
      const ctx = canvas.getContext('2d')
      
      // Рисуем оригинальное изображение
      ctx.drawImage(image, 0, 0)
      
      // Добавляем полупрозрачный оверлей внизу
      const overlayHeight = Math.min(300, image.height * 0.3)
      const gradient = ctx.createLinearGradient(0, image.height - overlayHeight, 0, image.height)
      gradient.addColorStop(0, 'rgba(236, 72, 153, 0.1)')
      gradient.addColorStop(1, 'rgba(236, 72, 153, 0.9)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, image.height - overlayHeight, image.width, overlayHeight)
      
      // Настройка текста
      const workout = photo.workouts
      const duration = workout.duration_seconds ? Math.floor(workout.duration_seconds / 60) : 0
      
      // Основной текст - количество повторений
      ctx.fillStyle = 'white'
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.lineWidth = 3
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const fontSize = Math.max(24, Math.min(48, image.width / 15))
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
      
      const mainText = `${workout.total_reps} ПОВТОРЕНИЙ`
      const y1 = image.height - overlayHeight * 0.7
      
      ctx.strokeText(mainText, image.width / 2, y1)
      ctx.fillText(mainText, image.width / 2, y1)
      
      // Дополнительная информация
      const subFontSize = Math.max(16, Math.min(32, image.width / 25))
      ctx.font = `${subFontSize}px system-ui, -apple-system, sans-serif`
      
      const subText = duration > 0 
        ? `${workout.total_sets} подходов • ${duration} минут`
        : `${workout.total_sets} подходов`
      const y2 = y1 + fontSize * 0.8
      
      ctx.strokeText(subText, image.width / 2, y2)
      ctx.fillText(subText, image.width / 2, y2)
      
      // Дата тренировки
      const dateFontSize = Math.max(12, Math.min(20, image.width / 35))
      ctx.font = `${dateFontSize}px system-ui, -apple-system, sans-serif`
      
      const date = new Date(workout.started_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      const y3 = y2 + subFontSize * 0.8
      
      ctx.strokeText(date, image.width / 2, y3)
      ctx.fillText(date, image.width / 2, y3)
      
      // Логотип/водяной знак
      ctx.font = `${Math.max(10, Math.min(16, image.width / 50))}px system-ui, -apple-system, sans-serif`
      ctx.textAlign = 'right'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillText('Pushups Tracker', image.width - 20, image.height - 20)
      
      // Конвертируем в Buffer
      const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 })
      
      // Загружаем обработанное изображение
      const processedFileName = `processed/${photo_id}.jpg`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('workout-photos')
        .upload(processedFileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        })
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('workout-photos')
        .getPublicUrl(processedFileName)
      
      // Обновляем запись в БД
      const { data: updatedPhoto } = await supabaseAdmin
        .from('workout_photos')
        .update({
          processed_url: publicUrl,
          stats_overlay_applied: true,
          processing_status: 'completed'
        })
        .eq('id', photo_id)
        .select()
        .single()
      
      return NextResponse.json({ 
        success: true, 
        photo: updatedPhoto,
        processed_url: publicUrl 
      })
      
    } catch (processingError) {
      console.error('Image processing error:', processingError)
      
      // Обновляем статус на failed
      await supabaseAdmin
        .from('workout_photos')
        .update({ processing_status: 'failed' })
        .eq('id', photo_id)
      
      return NextResponse.json(
        { error: 'Processing failed' },
        { status: 500 }
      )
    }
    
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: 'Invalid request' },
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