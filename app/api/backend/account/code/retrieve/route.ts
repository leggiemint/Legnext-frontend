import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { getUserApiKey } from '@/libs/auth-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    
    const userApiKey = getUserApiKey(request);

    if (!userApiKey) {
      return NextResponse.json(
        { error: 'User API key is required. Use X-API-KEY header' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code } = body;
    

    if (!code) {
      return NextResponse.json(
        { error: 'Redeem code is required' },
        { status: 400 }
      );
    }

    
    const result = await backendApiClient.redeemCode(userApiKey, code);
    
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Redeem code error:', error);
    return NextResponse.json(
      { error: 'Failed to redeem code' },
      { status: 500 }
    );
  }
}