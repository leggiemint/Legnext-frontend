import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 简单的健康检查端点，只返回 "OK" 文本
  // 适合 Coolify 的基本健康检查配置
  return new NextResponse('OK', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    }
  });
}
