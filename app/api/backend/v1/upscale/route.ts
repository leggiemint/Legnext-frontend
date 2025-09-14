import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { getUserApiKey } from '@/libs/auth-helpers';
import { log } from '@/libs/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const userApiKey = getUserApiKey(request);

    if (!userApiKey) {
      return NextResponse.json(
        { error: 'User API key is required. Use X-API-KEY header' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobId, imageNo, callback } = body;

    if (!jobId || imageNo === undefined) {
      return NextResponse.json(
        { error: 'jobId and imageNo are required' },
        { status: 400 }
      );
    }

    if (typeof imageNo !== 'number' || imageNo < 0 || imageNo > 3) {
      return NextResponse.json(
        { error: 'imageNo must be a number between 0 and 3' },
        { status: 400 }
      );
    }

    const result = await backendApiClient.createUpscale(userApiKey, {
      jobId,
      imageNo,
      callback,
    });

    return NextResponse.json(result);
  } catch (error) {
    log.error('Create upscale error:', error);
    return NextResponse.json(
      { error: 'Failed to create upscale task' },
      { status: 500 }
    );
  }
}