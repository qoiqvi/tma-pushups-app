import { NextRequest, NextResponse } from 'next/server'
import { validateTelegramWebAppData } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { initData } = body
    
    if (!initData) {
      return NextResponse.json(
        { error: 'InitData is required' },
        { status: 400 }
      )
    }
    
    const user = validateTelegramWebAppData(initData)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid init data' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}