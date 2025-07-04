import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import '@/types/telegram'
import { getTelegramInitData } from '@/lib/telegram/mock'

interface WorkoutPhoto {
  id: string
  workout_id: string
  original_url: string
  processed_url?: string
  stats_overlay_applied: boolean
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
}

// Получить фотографии тренировки
export function useWorkoutPhotos(workoutId: string): UseQueryResult<WorkoutPhoto[], Error> {
  return useQuery({
    queryKey: ['workoutPhotos', workoutId],
    queryFn: async () => {
      const response = await fetch(`/api/workouts/${workoutId}/photos`, {
        headers: {
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch workout photos')
      }
      
      return response.json()
    },
    enabled: !!workoutId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Получить конкретную фотографию
export function usePhoto(photoId: string): UseQueryResult<WorkoutPhoto, Error> {
  return useQuery({
    queryKey: ['photo', photoId],
    queryFn: async () => {
      const response = await fetch(`/api/photos/${photoId}`, {
        headers: {
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch photo')
      }
      
      return response.json()
    },
    enabled: !!photoId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Загрузить фотографию
export function useUploadPhoto(): UseMutationResult<WorkoutPhoto, Error, FormData> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload photo')
      }
      
      return response.json()
    },
    onSuccess: (uploadedPhoto) => {
      // Update workout photos cache
      queryClient.invalidateQueries({ 
        queryKey: ['workoutPhotos', uploadedPhoto.workout_id] 
      })
      
      // Set individual photo cache
      queryClient.setQueryData(['photo', uploadedPhoto.id], uploadedPhoto)
    },
  })
}

// Обработать фотографию (добавить статистику)
export function useProcessPhoto(): UseMutationResult<{ success: boolean; url: string }, Error, string> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (photoId: string) => {
      const response = await fetch('/api/photos/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
        body: JSON.stringify({ photoId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to process photo')
      }
      
      return response.json()
    },
    onSuccess: (_, photoId) => {
      // Invalidate photo cache to refetch updated status
      queryClient.invalidateQueries({ queryKey: ['photo', photoId] })
      
      // Also invalidate workout photos list
      const photo = queryClient.getQueryData(['photo', photoId]) as WorkoutPhoto
      if (photo) {
        queryClient.invalidateQueries({ 
          queryKey: ['workoutPhotos', photo.workout_id] 
        })
      }
    },
  })
}