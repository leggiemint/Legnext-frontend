import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { createErrorResponse } from '@/libs/backend-proxy-auth';


// 告诉Next.js这个API路由是动态的，不要在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try {
    // Get the API key from the X-API-KEY header
    const apiKey = request.headers.get('X-API-KEY');
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Missing X-API-KEY header',
          code: 'MISSING_API_KEY' 
        },
        { status: 400 }
      );
    }

    // Validate API key format
    if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid API key format',
          code: 'INVALID_API_KEY' 
        },
        { status: 400 }
      );
    }

    // Call the backend API server-side where process.env is available
    const response = await backendApiClient.getCurrentAccountInfo(apiKey.trim());
    
    return NextResponse.json(response);
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch account info');
  }
}