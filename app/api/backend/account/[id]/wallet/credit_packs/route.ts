import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = parseInt(params.id);
    
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    const result = await backendApiClient.getCreditPacks(accountId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get credit packs error:', error);
    return NextResponse.json(
      { error: 'Failed to get credit packs' },
      { status: 500 }
    );
  }
}