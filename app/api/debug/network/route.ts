import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headersList = headers();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: {
      hostname: process.env.HOSTNAME || 'not-set',
      port: process.env.PORT || 'not-set',
      nodeEnv: process.env.NODE_ENV,
    },
    request: {
      host: headersList.get('host'),
      userAgent: headersList.get('user-agent'),
      xForwardedFor: headersList.get('x-forwarded-for'),
    },
    process: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
    }
  }, { status: 200 });
}