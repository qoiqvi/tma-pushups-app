import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { parseInitData, validateInitDataFormat } from '@/lib/telegram/validation'

export function middleware(request: NextRequest) {
  // Пропускаем статику, auth routes, bot routes, health check и debug
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname.startsWith('/api/bot') ||
      request.nextUrl.pathname.startsWith('/api/health') ||
      request.nextUrl.pathname.startsWith('/api/debug-env')) {
    return NextResponse.next()
  }
  
  // Получаем initData из заголовка
  const initData = request.headers.get('X-Telegram-Init-Data')
  
  // Логирование убираем из middleware, так как он работает на сервере
  // console.log('[Middleware] Path:', request.nextUrl.pathname)
  // console.log('[Middleware] InitData present:', !!initData)
  // console.log('[Middleware] NODE_ENV:', process.env.NODE_ENV)
  
  // В режиме разработки используем mock данные
  if (!initData && process.env.NODE_ENV === 'development') {
    const mockUser = {
      id: 12345,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'ru'
    }
    
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('X-User-Id', mockUser.id.toString())
    requestHeaders.set('X-User-Data', JSON.stringify(mockUser))
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    })
  }
  
  // ВРЕМЕННОЕ РЕШЕНИЕ: Если нет initData но есть данные в URL, используем ID Димы
  if (!initData && request.url.includes('693920846')) {
    const tempUser = {
      id: 693920846,
      first_name: 'Дима',
      last_name: '',
      username: 'amasasin',
      language_code: 'ru',
      is_premium: true
    }
    
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('X-User-Id', tempUser.id.toString())
    requestHeaders.set('X-User-Data', JSON.stringify(tempUser))
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    })
  }
  
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
  
  // console.log('[Middleware] Parsed user:', user)
  
  if (!user) {
    console.error('[Middleware] Failed to parse user from initData:', initData)
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
