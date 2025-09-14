import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";

// 告诉Next.js这个API路由是动态的，不要在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    let databaseStatus = 'connected';

    // Try database connectivity (skip if DATABASE_URL is missing)
    if (process.env.DATABASE_URL) {
      try {
        const startTime = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const connectTime = Date.now() - startTime;
        databaseStatus = `connected_${connectTime}ms`;
        console.log(`Database connected successfully in ${connectTime}ms`);
      } catch (error) {
        console.error('Database connection failed:', error);
        databaseStatus = `disconnected_${error instanceof Error ? error.message : 'unknown_error'}`;
      }
    } else {
      databaseStatus = 'not_configured';
    }

    // Check only critical environment variables (skip DATABASE_URL check)
    const requiredEnvVars = [
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: 'warning',
          message: 'Some environment variables are missing',
          missing: missingEnvVars,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    }
    
    // Return health status
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown',
      database: databaseStatus,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        limit: Math.round(process.memoryUsage().rss / 1024 / 1024)
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}