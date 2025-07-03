import { useQuery, UseQueryResult } from '@tanstack/react-query'
import '@/types/telegram'

interface OverallStats {
  total_workouts: number
  total_reps: number
  current_streak: number
  max_streak: number
  avg_reps_per_workout: number
  personal_best_reps: number
  personal_best_date?: string
  last_workout_date?: string
}

interface PeriodStats {
  workouts_count: number
  total_reps: number
  total_sets: number
  total_duration: number
  avg_reps: number
}

interface ChartDataPoint {
  date: string
  dateFormatted: string
  reps: number
  sets: number
  duration: number
}

interface StatsResponse {
  overall_stats: OverallStats
  period_stats: PeriodStats
  chart_data: ChartDataPoint[]
  period: string
}

export function useStats(period: 'week' | 'month' | 'all' = 'week'): UseQueryResult<StatsResponse, Error> {
  return useQuery({
    queryKey: ['stats', period],
    queryFn: async () => {
      const response = await fetch(`/api/stats?period=${period}`, {
        headers: {
          'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || '',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Хук для получения только общей статистики
export function useOverallStats() {
  return useQuery({
    queryKey: ['stats', 'overall'],
    queryFn: async () => {
      const response = await fetch('/api/stats?period=all', {
        headers: {
          'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || '',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch overall stats')
      }
      
      const result = await response.json()
      return result.overall_stats
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Хук для получения данных графика по периоду
export function useChartData(period: 'week' | 'month' | 'all' = 'week') {
  return useQuery({
    queryKey: ['chartData', period],
    queryFn: async () => {
      const response = await fetch(`/api/stats?period=${period}`, {
        headers: {
          'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || '',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }
      
      const result = await response.json()
      return result.chart_data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Хук для получения статистики за период
export function usePeriodStats(period: 'week' | 'month' | 'all' = 'week') {
  return useQuery({
    queryKey: ['periodStats', period],
    queryFn: async () => {
      const response = await fetch(`/api/stats?period=${period}`, {
        headers: {
          'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || '',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch period stats')
      }
      
      const result = await response.json()
      return result.period_stats
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Хук для получения истории тренировок (для графика)
export function useWorkoutHistory(period: 'week' | 'month' | 'all' = 'week') {
  return useQuery({
    queryKey: ['workoutHistory', period],
    queryFn: async () => {
      const response = await fetch(`/api/workouts?period=${period}&limit=50`, {
        headers: {
          'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || '',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch workout history')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Хук для получения личных рекордов
export function usePersonalRecords() {
  return useQuery({
    queryKey: ['personalRecords'],
    queryFn: async () => {
      const response = await fetch('/api/stats?records=true', {
        headers: {
          'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || '',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch personal records')
      }
      
      const result = await response.json()
      return {
        most_reps: result.personal_records?.most_reps || null,
        longest_workout: result.personal_records?.longest_workout || null,
        most_sets: result.personal_records?.most_sets || null,
        current_streak: result.overall_stats?.current_streak || 0,
        total_workouts: result.overall_stats?.total_workouts || 0,
        total_reps: result.overall_stats?.total_reps || 0
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}