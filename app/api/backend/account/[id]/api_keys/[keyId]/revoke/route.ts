import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; keyId: string } }
) {
  try {
    const accountId = parseInt(params.id);
    const apiKeyId = parseInt(params.keyId);

    if (isNaN(accountId) || isNaN(apiKeyId)) {
      return NextResponse.json(
        { error: 'Invalid account ID or API key ID' },
        { status: 400 }
      );
    }

    const result = await backendApiClient.revokeApiKey(accountId, apiKeyId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Revoke API key error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}