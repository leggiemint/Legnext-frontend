import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 检查数据库连接（如果有的话）
    // 这里可以添加其他健康检查逻辑
    
    return NextResponse.json(
      { 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}