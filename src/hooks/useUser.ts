import { useQuery } from '@tanstack/react-query'
import { getTelegramInitData } from '@/lib/telegram/mock'

interface User {
  telegram_id: number
  username?: string
  first_name?: string
  last_name?: string
  language_code?: string
  is_premium?: boolean
  created_at: string
  updated_at: string
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch('/api/user/me', {
        headers: {
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      
      return response.json() as Promise<User>
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
  })
}