import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; notificationId: string } }
) {
  try {
    const accountId = parseInt(params.id);
    const notificationId = parseInt(params.notificationId);

    if (isNaN(accountId) || isNaN(notificationId)) {
      return NextResponse.json(
        { error: 'Invalid account ID or notification ID' },
        { status: 400 }
      );
    }

    const result = await backendApiClient.confirmNotification(accountId, notificationId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Confirm notification error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm notification' },
      { status: 500 }
    );
  }
}