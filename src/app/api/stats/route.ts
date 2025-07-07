import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, isAuthError } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { startOfWeek, endOfWeek, subDays, format, parseISO, differenceInDays } from 'date-fns'

// GET /api/stats - Получить статистику пользователя
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  
  if (isAuthError(authResult)) {
    return authResult.error
  }
  
  const userId = authResult.user.id
  
  console.log('[Stats API] User ID:', userId)

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'week' // week, month, all
  
  try {
    // Определяем фильтр по дате
    let dateFilter: { gte?: string; lte?: string } = {}
    const now = new Date()
    
    switch (period) {
      case 'week':
        dateFilter = {
          gte: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
          lte: endOfWeek(now, { weekStartsOn: 1 }).toISOString()
        }
        break
      case 'month':
        dateFilter = {
          gte: subDays(now, 30).toISOString(),
          lte: now.toISOString()
        }
        break
      case 'all':
        // Без фильтра по дате
        break
    }
    
    // Получаем тренировки за период
    let workoutsQuery = supabaseAdmin
      .from('workouts')
      .select('id, started_at, finished_at, total_reps, total_sets, duration_seconds')
      .eq('user_id', userId)
      .not('finished_at', 'is', null) // Только завершенные тренировки
      .order('started_at', { ascending: true })
    
    if (dateFilter.gte) {
      workoutsQuery = workoutsQuery.gte('started_at', dateFilter.gte)
    }
    if (dateFilter.lte) {
      workoutsQuery = workoutsQuery.lte('started_at', dateFilter.lte)
    }
    
    const { data: workouts, error: workoutsError } = await workoutsQuery
    
    console.log('[Stats API] Workouts query result:', { 
      count: workouts?.length || 0, 
      error: workoutsError?.message 
    })
    
    if (workoutsError) {
      console.error('[Stats API] Workouts error:', workoutsError)
      return NextResponse.json(
        { error: workoutsError.message },
        { status: 500 }
      )
    }
    
    // Получаем или вычисляем общую статистику пользователя
    const { data: userStats, error: statsError } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    // Если статистики нет, создаем новую запись
    let stats = userStats
    if (statsError || !userStats) {
      // Получаем все тренировки для вычисления общей статистики
      const { data: allWorkouts } = await supabaseAdmin
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: true })
      
      if (allWorkouts && allWorkouts.length > 0) {
        // Вычисляем streak
        const { currentStreak, maxStreak } = calculateStreaks(allWorkouts)
        
        // Вычисляем остальную статистику
        const totalWorkouts = allWorkouts.length
        const totalReps = allWorkouts.reduce((sum, w) => sum + w.total_reps, 0)
        const avgRepsPerWorkout = totalReps / totalWorkouts
        const personalBestReps = Math.max(...allWorkouts.map(w => w.total_reps))
        const personalBestWorkout = allWorkouts.find(w => w.total_reps === personalBestReps)
        const lastWorkoutDate = allWorkouts[allWorkouts.length - 1].started_at.split('T')[0]
        
        // Создаем запись в user_stats
        const newStats = {
          user_id: userId,
          total_workouts: totalWorkouts,
          total_reps: totalReps,
          current_streak: currentStreak,
          max_streak: maxStreak,
          last_workout_date: lastWorkoutDate,
          avg_reps_per_workout: Math.round(avgRepsPerWorkout * 10) / 10,
          personal_best_reps: personalBestReps,
          personal_best_date: personalBestWorkout?.started_at.split('T')[0] || null,
          updated_at: new Date().toISOString(),
        }
        
        const { data: createdStats } = await supabaseAdmin
          .from('user_stats')
          .upsert(newStats)
          .select()
          .single()
        
        stats = createdStats || newStats
      } else {
        // Если тренировок нет, создаем пустую статистику
        stats = {
          user_id: userId,
          total_workouts: 0,
          total_reps: 0,
          current_streak: 0,
          max_streak: 0,
          avg_reps_per_workout: 0,
          personal_best_reps: 0,
          personal_best_date: null,
          last_workout_date: null,
          updated_at: new Date().toISOString(),
        }
      }
    }
    
    // Подготавливаем данные для графика
    const chartData = workouts?.map(w => ({
      date: format(parseISO(w.started_at), 'yyyy-MM-dd'),
      dateFormatted: format(parseISO(w.started_at), 'dd.MM'),
      reps: w.total_reps,
      sets: w.total_sets,
      duration: w.duration_seconds ? Math.round(w.duration_seconds / 60) : 0
    })) || []
    
    // Вычисляем статистику за период
    const periodStats = {
      workouts_count: workouts?.length || 0,
      total_reps: workouts?.reduce((sum, w) => sum + w.total_reps, 0) || 0,
      total_sets: workouts?.reduce((sum, w) => sum + w.total_sets, 0) || 0,
      total_duration: workouts?.reduce((sum, w) => sum + (w.duration_seconds || 0), 0) || 0,
      avg_reps: workouts?.length ? Math.round((workouts.reduce((sum, w) => sum + w.total_reps, 0) / workouts.length) * 10) / 10 : 0
    }
    
    return NextResponse.json({
      // Общая статистика пользователя
      overall_stats: stats,
      // Статистика за выбранный период
      period_stats: periodStats,
      // Данные для графиков
      chart_data: chartData,
      period
    })
    
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Функция для вычисления серий (streaks)
function calculateStreaks(workouts: any[]): { currentStreak: number; maxStreak: number } {
  if (!workouts || workouts.length === 0) {
    return { currentStreak: 0, maxStreak: 0 }
  }
  
  // Группируем тренировки по дням
  const workoutDays = new Set(
    workouts.map(w => w.started_at.split('T')[0])
  )
  
  const sortedDays = Array.from(workoutDays).sort()
  
  let currentStreak = 0
  let maxStreak = 0
  let tempStreak = 1
  
  // Проверяем, есть ли тренировка сегодня или вчера
  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  
  const hasRecentWorkout = workoutDays.has(today) || workoutDays.has(yesterday)
  
  if (sortedDays.length === 1) {
    const streak = hasRecentWorkout ? 1 : 0
    return { currentStreak: streak, maxStreak: 1 }
  }
  
  // Вычисляем максимальную серию
  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = parseISO(sortedDays[i - 1])
    const currentDay = parseISO(sortedDays[i])
    const daysDiff = differenceInDays(currentDay, prevDay)
    
    if (daysDiff === 1) {
      tempStreak++
    } else {
      maxStreak = Math.max(maxStreak, tempStreak)
      tempStreak = 1
    }
  }
  maxStreak = Math.max(maxStreak, tempStreak)
  
  // Вычисляем текущую серию (только если есть недавняя тренировка)
  if (hasRecentWorkout) {
    let streak = 1
    const lastDay = sortedDays[sortedDays.length - 1]
    
    for (let i = sortedDays.length - 2; i >= 0; i--) {
      const currentDay = parseISO(sortedDays[i + 1])
      const prevDay = parseISO(sortedDays[i])
      const daysDiff = differenceInDays(currentDay, prevDay)
      
      if (daysDiff === 1) {
        streak++
      } else {
        break
      }
    }
    currentStreak = streak
  }
  
  return { currentStreak, maxStreak }
}