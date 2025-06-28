import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateTelegramWebAppData } from '@/lib/telegram/auth'

export function middleware(request: NextRequest) {
  // Пропускаем статику и API routes для аутентификации
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  
  // Получаем initData из заголовка
  const initData = request.headers.get('X-Telegram-Init-Data')
  
  if (!initData) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  const user = validateTelegramWebAppData(initData)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid init data' },
      { status: 401 }
    )
  }
  
  // Добавляем user в заголовки для использования в API
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('X-User-Id', user.id.toString())
  requestHeaders.set('X-User-Data', JSON.stringify(user))
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  })
}

export const config = {
  matcher: ['/api/:path*']
}