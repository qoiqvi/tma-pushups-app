import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip static files and public endpoints
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/telegram') ||
      request.nextUrl.pathname.startsWith('/api/health')) {
    return NextResponse.next()
  }
  
  // For API endpoints, check Telegram init data
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Get init data from header
    const initData = request.headers.get('X-Telegram-Init-Data')
    
    if (!initData) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing Telegram init data' },
        { status: 401 }
      )
    }
    
    // Note: We can't do full validation in middleware due to Edge Runtime limitations
    // Full validation will happen in the API routes
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}