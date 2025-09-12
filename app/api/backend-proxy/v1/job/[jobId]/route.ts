import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { validateParams, createErrorResponse } from '@/libs/backend-proxy-auth';
import { z } from 'zod';

const ParamsSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Validate API key
    const userApiKey = request.headers.get('X-API-KEY');
    if (!userApiKey) {
      return NextResponse.json(
        { 
          error: 'X-API-KEY header is required',
          code: 'MISSING_API_KEY' 
        },
        { status: 400 }
      );
    }

    if (typeof userApiKey !== 'string' || userApiKey.trim().length === 0) {
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

    // Call backend API
    const response = await backendApiClient.getJobStatus(userApiKey.trim(), jobId);
    return NextResponse.json(response);
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch job status');
  }
}
