import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 只在非生产环境提供此端点
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  const host = request.headers.get('host') || 'unknown';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';

  const checkResult = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    host,
    protocol,
    fullUrl: `${protocol}://${host}`,

    // 环境变量检查
    environmentVariables: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
      BACKEND_API_URL: process.env.BACKEND_API_URL || 'NOT_SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      DIRECT_URL: process.env.DIRECT_URL ? 'SET' : 'NOT_SET',
      BACKEND_API_KEY: process.env.BACKEND_API_KEY ? 'SET' : 'NOT_SET',
    },

    // 回调URL检查
    callbackUrls: {
      windowBased: `${protocol}://${host}/api/backend-proxy/callback`,
      envBased: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/backend-proxy/callback`,
      recommended: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/backend-proxy/callback`
        : `${protocol}://${host}/api/backend-proxy/callback`
    },

    // SSE端点检查
    sseEndpoints: {
      relative: '/api/backend-proxy/callback',
      absolute: `${protocol}://${host}/api/backend-proxy/callback`
    },

    // 配置建议
    recommendations: {
      shouldSetNextPublicAppUrl: !process.env.NEXT_PUBLIC_APP_URL,
      environmentMatch: {
        hostMatchesNextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL?.includes(host),
        nextAuthUrlSet: !!process.env.NEXTAUTH_URL,
        backendApiUrlSet: !!process.env.BACKEND_API_URL
      }
    }
  };

  return NextResponse.json(checkResult, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}