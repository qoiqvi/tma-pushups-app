import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import '@/types/telegram'
import { getTelegramInitData } from '@/lib/telegram/mock'

interface Workout {
  id: string
  user_id: number
  started_at: string
  finished_at?: string
  duration_seconds?: number
  total_reps: number
  total_sets: number
  notes?: string
  created_at: string
  sets?: WorkoutSet[]
}

interface WorkoutSet {
  id: string
  workout_id: string
  set_number: number
  reps: number
  rest_seconds: number
  created_at: string
}

interface WorkoutsResponse {
  workouts: Workout[]
  total: number
  offset: number
  limit: number
}

interface CreateWorkoutData {
  started_at: string
  notes?: string
}

interface UpdateWorkoutData {
  finished_at?: string
  duration_seconds?: number
  notes?: string
  total_reps?: number
  total_sets?: number
}

// Получить список тренировок
export function useWorkouts(limit = 10, offset = 0): UseQueryResult<WorkoutsResponse, Error> {
  return useQuery({
    queryKey: ['workouts', limit, offset],
    queryFn: async () => {
      const response = await fetch(`/api/workouts?limit=${limit}&offset=${offset}`, {
        headers: {
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch workouts')
      }
      
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Получить конкретную тренировку
export function useWorkout(id: string): UseQueryResult<Workout, Error> {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: async () => {
      const response = await fetch(`/api/workouts/${id}`, {
        headers: {
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch workout')
      }
      
      return response.json()
    },
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Создать новую тренировку
export function useCreateWorkout(): UseMutationResult<Workout, Error, CreateWorkoutData> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateWorkoutData) => {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create workout')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Invalidate workouts list
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

// Обновить тренировку
export function useUpdateWorkout(id: string): UseMutationResult<Workout, Error, UpdateWorkoutData> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: UpdateWorkoutData) => {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update workout')
      }
      
      return response.json()
    },
    onSuccess: (updatedWorkout) => {
      // Update specific workout in cache
      queryClient.setQueryData(['workout', id], updatedWorkout)
      // Invalidate workouts list
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      // If workout was finished, invalidate stats
      if (updatedWorkout.finished_at) {
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      }
    },
  })
}

// Удалить тренировку
export function useDeleteWorkout(): UseMutationResult<{ success: boolean }, Error, string> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete workout')
      }
      
      return response.json()
    },
    onSuccess: (_, deletedId) => {
      // Remove workout from cache
      queryClient.removeQueries({ queryKey: ['workout', deletedId] })
      // Invalidate workouts list
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

// Получить активную тренировку (не завершенную)
export function useActiveWorkout() {
  return useQuery({
    queryKey: ['activeWorkout'],
    queryFn: async () => {
      const response = await fetch('/api/workouts?limit=1&offset=0', {
        headers: {
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch active workout')
      }
      
      const result = await response.json()
      return result.workouts?.find((w: Workout) => !w.finished_at) || null
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}