import { NextRequest, NextResponse } from 'next/server'

// Этот endpoint для тестирования что приходит в заголовках
export async function POST(request: NextRequest) {
  const headers: Record<string, string> = {}
  
  // Собираем все заголовки
  request.headers.forEach((value, key) => {
    // Скрываем чувствительные данные
    if (key.toLowerCase().includes('cookie') || key.toLowerCase().includes('authorization')) {
      headers[key] = '***HIDDEN***'
    } else {
      headers[key] = value
    }
  })

  // Пробуем получить body
  let body = null
  try {
    body = await request.json()
  } catch {
    body = 'No JSON body'
  }

  return NextResponse.json({
    method: request.method,
    url: request.url,
    headers,
    body,
    middleware_headers: {
      'x-telegram-init-data': request.headers.get('x-telegram-init-data'),
      'x-user-id': request.headers.get('x-user-id'),
      'x-user-data': request.headers.get('x-user-data'),
    }
  })
}