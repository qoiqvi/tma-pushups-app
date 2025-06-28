import { NextRequest } from 'next/server'
import { TelegramUser } from './validation'

export function getUserFromRequest(request: NextRequest): TelegramUser | null {
  const userDataHeader = request.headers.get('X-User-Data')
  
  if (!userDataHeader) {
    return null
  }
  
  try {
    return JSON.parse(userDataHeader) as TelegramUser
  } catch {
    return null
  }
}

export function getUserIdFromRequest(request: NextRequest): number | null {
  const userIdHeader = request.headers.get('X-User-Id')
  
  if (!userIdHeader) {
    return null
  }
  
  const userId = parseInt(userIdHeader, 10)
  return isNaN(userId) ? null : userId
}