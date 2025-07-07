import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, isAuthError } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  
  if (isAuthError(authResult)) {
    return authResult.error
  }

  // Return user data
  return NextResponse.json({
    id: authResult.user.id,
    telegramId: authResult.user.telegramId,
    username: authResult.user.username,
    firstName: authResult.user.firstName,
    lastName: authResult.user.lastName,
    languageCode: authResult.user.languageCode,
    isPremium: authResult.user.isPremium
  })
}