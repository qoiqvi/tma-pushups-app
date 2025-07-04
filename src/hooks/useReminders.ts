import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import '@/types/telegram'
import { getTelegramInitData } from '@/lib/telegram/mock'

interface ReminderSettings {
  user_id: number
  days_of_week: number[]
  reminder_time: string
  timezone: string
  enabled: boolean
  last_sent_at?: string
  created_at: string
  updated_at: string
}

interface UpdateReminderSettings {
  days_of_week?: number[]
  reminder_time?: string
  timezone?: string
  enabled?: boolean
}

// Получить настройки напоминаний
export function useReminderSettings(): UseQueryResult<ReminderSettings, Error> {
  return useQuery({
    queryKey: ['reminderSettings'],
    queryFn: async () => {
      const response = await fetch('/api/reminders', {
        headers: {
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch reminder settings')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Обновить настройки напоминаний
export function useUpdateReminderSettings(): UseMutationResult<ReminderSettings, Error, UpdateReminderSettings> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: UpdateReminderSettings) => {
      const response = await fetch('/api/reminders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update reminder settings')
      }
      
      return response.json()
    },
    onSuccess: (updatedSettings) => {
      // Update cache
      queryClient.setQueryData(['reminderSettings'], updatedSettings)
    },
  })
}