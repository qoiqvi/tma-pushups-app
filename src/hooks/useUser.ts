import { useTelegramAuth } from '@/components/TelegramAuthProvider'

export function useUser() {
  // Now we just use the TelegramAuthProvider which handles everything
  const { user, isLoading, error, refetch } = useTelegramAuth()
  
  return {
    data: user,
    isLoading,
    error,
    refetch,
  }
}