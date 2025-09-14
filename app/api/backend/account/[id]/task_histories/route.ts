import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '10');
    
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    const result = await backendApiClient.getTaskHistories(accountId, page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get task histories error:', error);
    return NextResponse.json(
      { error: 'Failed to get task histories' },
      { status: 500 }
    );
  }
}