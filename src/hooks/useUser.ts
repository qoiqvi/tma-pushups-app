import { useQuery } from '@tanstack/react-query'
import { getTelegramInitData } from '@/lib/telegram/mock'
import { logger } from '@/lib/debug'

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
      logger.info('Fetching user data...')
      const initData = getTelegramInitData()
      logger.info('User InitData', { length: initData.length })
      
      const response = await fetch('/api/user/me', {
        headers: {
          'X-Telegram-Init-Data': initData,
        },
      })
      
      logger.info('User response', { status: response.status, ok: response.ok })
      
      if (!response.ok) {
        const error = await response.text()
        logger.error('Failed to fetch user', { status: response.status, error })
        throw new Error('Failed to fetch user')
      }
      
      const user = await response.json() as User
      logger.info('User loaded successfully', user)
      return user
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
  })
}