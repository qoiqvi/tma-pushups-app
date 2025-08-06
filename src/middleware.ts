import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;
  
  // Log API requests for debugging
  if (pathname.startsWith('/api/')) {
    const initData = request.headers.get('X-Telegram-Init-Data');
    console.log('[Middleware] API request', {
      path: pathname,
      method: request.method,
      hasInitData: !!initData,
      timestamp: new Date().toISOString()
    });
  }
  
  // Skip static files and public endpoints
  if (pathname.startsWith('/_next') ||
      pathname.startsWith('/api/telegram') ||
      pathname.startsWith('/api/health') ||
      pathname.startsWith('/api/test-auth') ||
      pathname.startsWith('/api/debug')) {
    return NextResponse.next()
  }
  
  // For protected API endpoints, check Telegram init data
  if (pathname.startsWith('/api')) {
    // Get init data from header
    const initData = request.headers.get('X-Telegram-Init-Data')
    
    if (!initData) {
      console.warn('[Middleware] Missing init data for protected route:', pathname);
      return NextResponse.json(
        { error: 'Unauthorized: Missing Telegram init data' },
        { status: 401 }
      )
    }
    
    // Note: We can't do full validation in middleware due to Edge Runtime limitations
    // Full validation will happen in the API routes
    const response = NextResponse.next();
    
    // Add timing header
    const duration = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${duration}ms`);
    
    return response;
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}