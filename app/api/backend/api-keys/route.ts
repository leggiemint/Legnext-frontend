import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import { backendApiClient } from '@/libs/backend-api-client';
import { getUserWithProfile } from '@/libs/user-helpers';
import { log } from '@/libs/logger';

export const dynamic = 'force-dynamic';

// Get current user's backend account ID
async function getBackendAccountId(): Promise<number | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  try {
    const user = await getUserWithProfile(session.user.id);
    return user?.profile?.backendAccountId || null;
  } catch (error) {
    log.error('Error getting backend account ID:', error);
    return null;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendAccountId = await getBackendAccountId();
    if (!backendAccountId) {
      return NextResponse.json({ error: 'Backend account not found' }, { status: 404 });
    }

    const result = await backendApiClient.getAccountApiKeys(backendAccountId);
    
    // Mark API keys as init key - only the first key (by ID) is considered init key
    // This assumes the first key created during account setup is the init key
    const sortedKeys = result.data.sort((a, b) => a.id - b.id);
    const apiKeysWithInitFlag = sortedKeys.map((key, index) => ({
      ...key,
      isInitKey: index === 0 // Only the first key (lowest ID) is the init key
    }));

    return NextResponse.json({
      ...result,
      data: apiKeysWithInitFlag,
    });
  } catch (error) {
    log.error('Get API keys error:', error);
    return NextResponse.json(
      { error: 'Failed to get API keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendAccountId = await getBackendAccountId();
    if (!backendAccountId) {
      return NextResponse.json({ error: 'Backend account not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    const result = await backendApiClient.createApiKey(backendAccountId, name);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}