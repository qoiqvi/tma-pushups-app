import { supabaseAdmin } from './supabase'
import { format, parseISO, differenceInDays, subDays } from 'date-fns'

// Функция для пересчета и обновления статистики пользователя
export async function updateUserStats(userId: number) {
  try {
    // Получаем все завершенные тренировки пользователя
    const { data: workouts, error: workoutsError } = await supabaseAdmin
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: true })

    if (workoutsError) {
      throw workoutsError
    }

    if (!workouts || workouts.length === 0) {
      // Если тренировок нет, создаем пустую статистику
      await supabaseAdmin
        .from('user_stats')
        .upsert({
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
        })
      return
    }

    // Вычисляем статистику
    const totalWorkouts = workouts.length
    const totalReps = workouts.reduce((sum, w) => sum + w.total_reps, 0)
    const avgRepsPerWorkout = Math.round((totalReps / totalWorkouts) * 10) / 10
    const personalBestReps = Math.max(...workouts.map(w => w.total_reps))
    const personalBestWorkout = workouts.find(w => w.total_reps === personalBestReps)
    const lastWorkoutDate = workouts[workouts.length - 1].started_at.split('T')[0]

    // Вычисляем streak
    const { currentStreak, maxStreak } = calculateStreaks(workouts)

    // Получаем текущую статистику для сохранения max_streak
    const { data: currentStats } = await supabaseAdmin
      .from('user_stats')
      .select('max_streak')
      .eq('user_id', userId)
      .single()

    // Обновляем статистику
    const updatedStats = {
      user_id: userId,
      total_workouts: totalWorkouts,
      total_reps: totalReps,
      current_streak: currentStreak,
      max_streak: Math.max(maxStreak, currentStats?.max_streak || 0),
      avg_reps_per_workout: avgRepsPerWorkout,
      personal_best_reps: personalBestReps,
      personal_best_date: personalBestWorkout?.started_at.split('T')[0] || null,
      last_workout_date: lastWorkoutDate,
      updated_at: new Date().toISOString(),
    }

    await supabaseAdmin
      .from('user_stats')
      .upsert(updatedStats)

    return updatedStats
  } catch (error) {
    console.error('Error updating user stats:', error)
    throw error
  }
}

// Функция для вычисления серий (streaks) - та же что в API
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