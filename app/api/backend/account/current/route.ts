import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { getUserApiKey } from '@/libs/auth-helpers';

// 告诉Next.js这个API路由是动态的，不要在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { log } from '@/libs/logger';

export async function GET(request: NextRequest) {
  try {
    const userApiKey = getUserApiKey(request);

    if (!userApiKey) {
      return NextResponse.json(
        { error: 'User API key is required. Use X-API-KEY header' },
        { status: 401 }
      );
    }

    const result = await backendApiClient.getCurrentAccountInfo(userApiKey);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Get current account info error:', error);
    return NextResponse.json(
      { error: 'Failed to get account info' },
      { status: 500 }
    );
  }
}