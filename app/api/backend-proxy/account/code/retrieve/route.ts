import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { createErrorResponse } from '@/libs/backend-proxy-auth';
import { z } from 'zod';

// 告诉Next.js这个API路由是动态的，不要在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RedeemCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(100, 'Code is too long'),
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const userApiKey = request.headers.get('X-API-KEY');
    if (!userApiKey) {
      return NextResponse.json(
        { 
          error: 'X-API-KEY header is required',
          code: 'MISSING_API_KEY' 
        },
        { status: 400 }
      );
    }

    if (typeof userApiKey !== 'string' || userApiKey.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid API key format',
          code: 'INVALID_API_KEY' 
        },
        { status: 400 }
      );
    }

    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON' 
        },
        { status: 400 }
      );
    }

    // Validate code parameter
    const validation = RedeemCodeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          code: 'INVALID_PARAMS',
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const { code } = validation.data;

    // Call backend API
    const response = await backendApiClient.redeemCode(userApiKey.trim(), code);
    return NextResponse.json(response);
  } catch (error) {
    return createErrorResponse(error, 'Failed to redeem code');
  }
}
