import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { getUserApiKey } from '@/libs/auth-helpers';

// 告诉Next.js这个API路由是动态的，不要在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const { text, callback } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text prompt is required' },
        { status: 400 }
      );
    }

    const result = await backendApiClient.createDiffusion(userApiKey, {
      text,
      callback,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Create diffusion error:', error);
    return NextResponse.json(
      { error: 'Failed to create diffusion task' },
      { status: 500 }
    );
  }
}