import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 检查环境变量
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      HOSTNAME: process.env.HOSTNAME,
      PORT: process.env.PORT,
      BACKEND_API_URL: process.env.BACKEND_API_URL ? 'SET' : 'NOT_SET',
      BASE_MANAGER_URL: process.env.BASE_MANAGER_URL ? 'SET' : 'NOT_SET',
      BACKEND_API_KEY: process.env.BACKEND_API_KEY ? 'SET' : 'NOT_SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
    };

    // 检查后端API连接
    let backendStatus = 'unknown';
    try {
      const backendUrl = process.env.BACKEND_API_URL || process.env.BASE_MANAGER_URL || 'https://api.legnext.ai';
      const response = await fetch(`${backendUrl}/api/account/info`, {
        method: 'GET',
        headers: {
          'API-KEY': process.env.BACKEND_API_KEY || '',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5秒超时
      });
      backendStatus = response.ok ? 'healthy' : `error_${response.status}`;
    } catch (error) {
      backendStatus = `error_${error instanceof Error ? error.message : 'unknown'}`;
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      backend: {
        status: backendStatus,
        url: process.env.BACKEND_API_URL || process.env.BASE_MANAGER_URL || 'https://api.legnext.ai',
      },
      services: {
        api: 'healthy',
        database: process.env.DATABASE_URL ? 'configured' : 'not_configured',
        auth: process.env.NEXTAUTH_SECRET ? 'configured' : 'not_configured',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}