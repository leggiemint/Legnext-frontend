import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 基本健康检查
    const healthData: {
      status: string;
      timestamp: string;
      uptime: number;
      version: string;
      environment: string;
      database?: string;
      warnings?: string[];
    } = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // 检查数据库连接（如果有 Prisma）
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      healthData.database = 'connected';
    } catch (dbError) {
      // 数据库连接失败，但不影响基本健康检查
      healthData.database = 'disconnected';
      healthData.warnings = healthData.warnings || [];
      healthData.warnings.push('Database connection failed');
    }

    return NextResponse.json(healthData, { status: 200 });
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