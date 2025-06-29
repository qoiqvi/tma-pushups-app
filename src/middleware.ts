import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { parseInitData, validateInitDataFormat } from '@/lib/telegram/validation'

export function middleware(request: NextRequest) {
  // Пропускаем статику, auth routes, bot routes и health check
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname.startsWith('/api/bot') ||
      request.nextUrl.pathname.startsWith('/api/health')) {
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
  
  // Проверяем формат данных
  if (!validateInitDataFormat(initData)) {
    return NextResponse.json(
      { error: 'Invalid init data format' },
      { status: 401 }
    )
  }
  
  const user = parseInitData(initData)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid user data' },
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