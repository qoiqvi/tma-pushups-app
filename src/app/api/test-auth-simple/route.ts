import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const initData = request.headers.get('X-Telegram-Init-Data');
  
  console.log('[Test Auth] Headers:', Object.fromEntries(request.headers.entries()));
  console.log('[Test Auth] Init Data:', initData);
  
  return NextResponse.json({
    hasInitData: !!initData,
    initDataLength: initData?.length || 0,
    headers: Object.fromEntries(request.headers.entries()),
    env: process.env.NODE_ENV,
  });
}