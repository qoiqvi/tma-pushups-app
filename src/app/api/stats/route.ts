import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/telegram'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/stats - Получить статистику пользователя
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    )
  }

  try {
    // Получаем или создаем запись статистики
    let { data: stats, error } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Если статистики нет, создаем пустую запись
      const { data: newStats, error: createError } = await supabaseAdmin
        .from('user_stats')
        .insert({
          user_id: userId,
          total_workouts: 0,
          total_reps: 0,
          current_streak: 0,
          max_streak: 0,
          avg_reps_per_workout: 0,
          personal_best_reps: 0
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        )
      }
      stats = newStats
    } else if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Получаем актуальную статистику из тренировок
    const { data: workouts } = await supabaseAdmin
      .from('workouts')
      .select('total_reps, started_at, finished_at')
      .eq('user_id', userId)
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false })

    if (workouts && workouts.length > 0) {
      const totalWorkouts = workouts.length
      const totalReps = workouts.reduce((sum, w) => sum + (w.total_reps || 0), 0)
      const avgRepsPerWorkout = totalReps / totalWorkouts
      const personalBestReps = Math.max(...workouts.map(w => w.total_reps || 0))

      // Вычисляем streak
      const { currentStreak, maxStreak } = calculateStreaks(workouts)

      // Обновляем статистику в БД
      const updatedStats = {
        total_workouts: totalWorkouts,
        total_reps: totalReps,
        current_streak: currentStreak,
        max_streak: Math.max(maxStreak, stats?.max_streak || 0),
        avg_reps_per_workout: avgRepsPerWorkout,
        personal_best_reps: Math.max(personalBestReps, stats?.personal_best_reps || 0),
        personal_best_date: personalBestReps > (stats?.personal_best_reps || 0) 
          ? workouts.find(w => w.total_reps === personalBestReps)?.started_at?.split('T')[0]
          : stats?.personal_best_date,
        last_workout_date: workouts[0]?.started_at?.split('T')[0]
      }

      await supabaseAdmin
        .from('user_stats')
        .update(updatedStats)
        .eq('user_id', userId)

      return NextResponse.json({
        ...stats,
        ...updatedStats
      })
    }

    return NextResponse.json(stats)
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Функция для вычисления streak
function calculateStreaks(workouts: any[]): { currentStreak: number, maxStreak: number } {
  if (!workouts.length) return { currentStreak: 0, maxStreak: 0 }

  // Группируем тренировки по дням
  const workoutDays = workouts
    .map(w => w.started_at.split('T')[0])
    .filter((date, index, arr) => arr.indexOf(date) === index) // уникальные дни
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // сортируем по убыванию

  let currentStreak = 0
  let maxStreak = 0
  let tempStreak = 0

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // Проверяем текущий streak
  let expectedDate = workoutDays[0] === todayStr ? today : yesterday
  
  for (const workoutDay of workoutDays) {
    const expectedDateStr = expectedDate.toISOString().split('T')[0]
    
    if (workoutDay === expectedDateStr) {
      currentStreak++
      tempStreak++
      maxStreak = Math.max(maxStreak, tempStreak)
      
      expectedDate.setDate(expectedDate.getDate() - 1)
    } else {
      // Если пропуск более чем на день, сбрасываем текущий streak
      const daysDiff = Math.floor(
        (new Date(expectedDateStr).getTime() - new Date(workoutDay).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      
      if (daysDiff > 1) {
        if (currentStreak === tempStreak) {
          currentStreak = 0
        }
        tempStreak = 1
        expectedDate = new Date(workoutDay)
        expectedDate.setDate(expectedDate.getDate() - 1)
      }
    }
  }

  // Если последняя тренировка была не вчера и не сегодня, текущий streak = 0
  if (workoutDays[0] !== todayStr && workoutDays[0] !== yesterdayStr) {
    currentStreak = 0
  }

  return { currentStreak, maxStreak }
}