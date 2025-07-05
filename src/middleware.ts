import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validate, type InitData } from '@telegram-apps/init-data-node'

export async function middleware(request: NextRequest) {
  // Пропускаем статику, auth routes, bot routes, health check и debug
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname.startsWith('/api/bot') ||
      request.nextUrl.pathname.startsWith('/api/health') ||
      request.nextUrl.pathname.startsWith('/api/debug-env') ||
      request.nextUrl.pathname.startsWith('/api/test-auth')) {
    return NextResponse.next()
  }
  
  // Получаем initData из заголовка
  const initData = request.headers.get('X-Telegram-Init-Data')
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  // Логирование для отладки
  console.log('[Middleware] Path:', request.nextUrl.pathname)
  console.log('[Middleware] InitData present:', !!initData)
  console.log('[Middleware] BOT_TOKEN present:', !!botToken)
  
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
  
  // Валидация с использованием официального пакета
  let validatedData: any   = null;
  
  try {
    if (botToken) {
      // Используем официальную валидацию если есть токен бота
      validatedData =  validate(initData, botToken);
      console.log('[Middleware] Official validation passed');
    } else {
      // Fallback: парсим данные без валидации подписи
      console.warn('[Middleware] BOT_TOKEN not set, parsing without signature validation');
      const params = new URLSearchParams(initData);
      const userStr = params.get('user');
      
      if (userStr) {
        const user = JSON.parse(userStr);
        validatedData = {
          user,
          auth_date: parseInt(params.get('auth_date') || '0'),
          hash: params.get('hash') || '',
          signature: params.get('signature') || ''
        } as unknown as InitData;
      }
    }
  } catch (error) {
    console.error('[Middleware] Validation error:', error);
    return NextResponse.json(
      { error: 'Invalid init data' },
      { status: 401 }
    )
  }
  
  if (!validatedData || !validatedData.user) {
    console.error('[Middleware] No user data in validated init data');
    return NextResponse.json(
      { error: 'Invalid user data' },
      { status: 401 }
    )
  }
  
  const user = validatedData.user
  
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
