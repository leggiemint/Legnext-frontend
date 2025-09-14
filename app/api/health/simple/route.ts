import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 最简单的健康检查端点
  // 立即返回 OK，不做任何外部调用或复杂检查
  return new NextResponse('OK', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}

// 也支持 HEAD 请求，某些健康检查工具可能使用
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}
