import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { createErrorResponse } from '@/libs/backend-proxy-auth';
import { z } from 'zod';

const UpscaleSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  imageNo: z.number().int().min(0).max(3, 'Image number must be between 0 and 3'),
  callback: z.string().url('Invalid callback URL').optional(),
});

export async function POST(request: NextRequest) {
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

    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON' 
        },
        { status: 400 }
      );
    }

    // Validate upscale parameters
    const validation = UpscaleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          code: 'INVALID_PARAMS',
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const { jobId, imageNo, callback } = validation.data;

    // Call backend API
    const response = await backendApiClient.createUpscale(userApiKey.trim(), {
      jobId,
      imageNo,
      ...(callback && { callback }),
    });
    return NextResponse.json(response);
  } catch (error) {
    return createErrorResponse(error, 'Failed to create upscale');
  }
}
