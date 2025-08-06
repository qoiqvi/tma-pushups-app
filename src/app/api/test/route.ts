import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api/auth';

/**
 * Test endpoint to verify authentication flow
 */
export async function GET(request: NextRequest) {
  console.log('[Test] Headers:', Object.fromEntries(request.headers.entries()));
  
  // Try to authenticate
  const authResult = await authenticateRequest(request);
  
  if ('error' in authResult) {
    console.log('[Test] Authentication failed');
    return authResult.error;
  }
  
  console.log('[Test] Authentication successful:', authResult.user);
  
  return NextResponse.json({
    success: true,
    user: authResult.user,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  // Test creating data with authentication
  const authResult = await authenticateRequest(request);
  
  if ('error' in authResult) {
    return authResult.error;
  }
  
  const body = await request.json();
  
  return NextResponse.json({
    success: true,
    user: authResult.user,
    receivedData: body,
    message: 'Test POST successful'
  });
}