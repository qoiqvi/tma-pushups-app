import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Пропускаем статику и публичные endpoints
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/telegram') ||
      request.nextUrl.pathname.startsWith('/api/health')) {
    return NextResponse.next()
  }
  
  // Для API endpoints проверяем user ID
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Получаем user ID из заголовка
    const userId = request.headers.get('X-User-Id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Передаем user ID дальше
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}