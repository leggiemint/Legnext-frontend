import { NextResponse } from "next/server";

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  responseTime: number;
  checks: {
    configuration: {
      status: 'pass' | 'fail';
      message: string;
      details?: any;
    };
    connectivity: {
      status: 'pass' | 'fail';
      message: string;
      responseTime?: number;
      error?: string;
    };
    webhook: {
      status: 'pass' | 'fail';
      message: string;
      details?: any;
    };
  };
  version?: string;
}

// 检查Square配置
async function checkConfiguration(): Promise<{ status: 'pass' | 'fail'; message: string; details?: any }> {
  const requiredEnvVars = [
    'SQUARE_ACCESS_TOKEN',
    'SQUARE_LOCATION_ID',
    'SQUARE_WEBHOOK_SECRET',
    'SQUARE_ENVIRONMENT'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    return {
      status: 'fail',
      message: `Missing required environment variables: ${missingVars.join(', ')}`,
      details: {
        missingVars,
        totalRequired: requiredEnvVars.length,
        configuredCount: requiredEnvVars.length - missingVars.length
      }
    };
  }

  return {
    status: 'pass',
    message: 'All required environment variables are configured',
    details: {
      environment: process.env.SQUARE_ENVIRONMENT,
      hasWebhookSecret: !!process.env.SQUARE_WEBHOOK_SECRET,
      hasAccessToken: !!process.env.SQUARE_ACCESS_TOKEN,
      hasLocationId: !!process.env.SQUARE_LOCATION_ID
    }
  };
}

// 检查Square API连接性
async function checkConnectivity(): Promise<{ status: 'pass' | 'fail'; message: string; responseTime?: number; error?: string }> {
  const startTime = Date.now();

  try {
    // 动态导入Square客户端以避免在配置检查失败时出错
    const { SquareClient, SquareEnvironment } = await import('square');

    const token = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT;

    if (!token) {
      throw new Error('SQUARE_ACCESS_TOKEN is not configured');
    }

    const client = new SquareClient({
      token: token,
      environment: environment === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox
    });

    // 尝试一个简单的API调用来测试连接
    await client.locations.list();

    const responseTime = Date.now() - startTime;

    return {
      status: 'pass',
      message: `Successfully connected to Square ${environment} API`,
      responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      status: 'fail',
      message: `Failed to connect to Square API: ${error.message}`,
      responseTime,
      error: error.message
    };
  }
}

// 检查webhook配置
async function checkWebhookConfiguration(): Promise<{ status: 'pass' | 'fail'; message: string; details?: any }> {
  const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;

  if (!webhookSecret) {
    return {
      status: 'fail',
      message: 'SQUARE_WEBHOOK_SECRET is not configured',
      details: {
        hasSecret: false,
        hasNotificationUrl: !!notificationUrl
      }
    };
  }

  return {
    status: 'pass',
    message: 'Webhook configuration is valid',
    details: {
      hasSecret: true,
      secretLength: webhookSecret.length,
      hasNotificationUrl: !!notificationUrl
    }
  };
}

export async function GET() {
  const startTime = Date.now();

  try {
    console.log('🏥 Square health check requested');

    // 并行执行所有检查
    const [configCheck, connectivityCheck, webhookCheck] = await Promise.all([
      checkConfiguration(),
      checkConnectivity(),
      checkWebhookConfiguration()
    ]);

    // 确定整体健康状态
    const checks = { configuration: configCheck, connectivity: connectivityCheck, webhook: webhookCheck };
    const failedChecks = Object.values(checks).filter(check => check.status === 'fail');
    const degradedChecks = Object.values(checks).filter(check => check.status === 'fail' || connectivityCheck.status === 'fail');

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (failedChecks.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedChecks.length > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      checks,
      version: process.env.npm_package_version || '1.0.0'
    };

    console.log(`🏥 Square health check completed: ${overallStatus}`, {
      responseTime: result.responseTime,
      failedChecks: failedChecks.length,
      timestamp: result.timestamp
    });

    // 根据状态返回相应的HTTP状态码
    const httpStatus = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(result, { status: httpStatus });

  } catch (error) {
    const responseTime = Date.now() - startTime;

    console.error('❌ Square health check failed:', {
      error: error.message,
      stack: error.stack,
      responseTime,
      timestamp: new Date().toISOString()
    });

    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      checks: {
        configuration: { status: 'fail', message: 'Health check failed' },
        connectivity: { status: 'fail', message: 'Health check failed' },
        webhook: { status: 'fail', message: 'Health check failed' }
      }
    };

    return NextResponse.json(errorResult, { status: 503 });
  }
}
