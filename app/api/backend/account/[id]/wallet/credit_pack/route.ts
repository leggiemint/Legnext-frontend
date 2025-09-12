import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = parseInt(params.id);
    const body = await request.json();
    const { capacity, description, expired_at } = body;

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    if (!capacity || !description) {
      return NextResponse.json(
        { error: 'Capacity and description are required' },
        { status: 400 }
      );
    }

    const result = await backendApiClient.createCreditPack(accountId, {
      capacity: parseInt(capacity),
      description,
      expired_at,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Create credit pack error:', error);
    return NextResponse.json(
      { error: 'Failed to create credit pack' },
      { status: 500 }
    );
  }
}