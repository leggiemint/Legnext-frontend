import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { validateParams, createErrorResponse } from '@/libs/backend-proxy-auth';
import { log } from '@/libs/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const startTime = Date.now();
  
  try {
    // 只在开发环境记录详细的请求信息
    if (process.env.NODE_ENV === 'development') {
      log.info('🔍 Job status request received:', {
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString()
      });
    }

    // Validate API key
    const userApiKey = request.headers.get('X-API-KEY');
    if (!userApiKey) {
      log.warn('❌ Missing API key in job status request');
      return NextResponse.json(
        { 
          error: 'X-API-KEY header is required',
          code: 'MISSING_API_KEY' 
        },
        { status: 400 }
      );
    }

    if (typeof userApiKey !== 'string' || userApiKey.trim().length === 0) {
      log.warn('❌ Invalid API key format in job status request');
      return NextResponse.json(
        { 
          error: 'Invalid API key format',
          code: 'INVALID_API_KEY' 
        },
        { status: 400 }
      );
    }

    // Validate route parameters
    const paramResult = validateParams(params, ParamsSchema);
    if (paramResult instanceof NextResponse) return paramResult;

    const { jobId } = paramResult;

    // 记录关键信息
    log.info('📊 Fetching job status:', {
      job_id: jobId
    });

    // Call backend API
    const response = await backendApiClient.getJobStatus(userApiKey.trim(), jobId);
    
    const duration = Date.now() - startTime;
    log.info('✅ Job status response:', {
      job_id: jobId,
      status: response.status,
      duration_ms: duration
    });

    return NextResponse.json(response);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    log.error('❌ Job status error:', {
      job_id: params.jobId,
      error: error.message,
      duration_ms: duration
    });
    
    return createErrorResponse(error, 'Failed to fetch job status');
  }
}
