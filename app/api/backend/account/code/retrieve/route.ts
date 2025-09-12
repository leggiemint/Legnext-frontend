import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { getUserApiKey } from '@/libs/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    console.log('🎁 Redeem code API called');
    
    const userApiKey = getUserApiKey(request);
    console.log('🔑 User API Key found:', userApiKey ? 'Yes' : 'No');

    if (!userApiKey) {
      console.log('❌ No API key provided');
      return NextResponse.json(
        { error: 'User API key is required. Use X-API-KEY header' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code } = body;
    
    console.log('📝 Redeem code request:', { code, codeLength: code?.length });

    if (!code) {
      console.log('❌ No redeem code provided');
      return NextResponse.json(
        { error: 'Redeem code is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Calling backend API with:', { userApiKey: userApiKey.substring(0, 10) + '...', code });
    
    const result = await backendApiClient.redeemCode(userApiKey, code);
    
    console.log('✅ Backend API result:', {
      code: result.code,
      message: result.message,
      data: result.data
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Redeem code error:', error);
    return NextResponse.json(
      { error: 'Failed to redeem code' },
      { status: 500 }
    );
  }
}