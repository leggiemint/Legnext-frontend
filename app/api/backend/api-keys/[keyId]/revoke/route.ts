import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import { backendApiClient } from '@/libs/backend-api-client';
import { getUserWithProfile } from '@/libs/user-helpers';

// 告诉Next.js这个API路由是动态的，不要在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    console.error('Error getting backend account ID:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendAccountId = await getBackendAccountId();
    if (!backendAccountId) {
      return NextResponse.json({ error: 'Backend account not found' }, { status: 404 });
    }

    const keyId = parseInt(params.keyId);
    if (isNaN(keyId)) {
      return NextResponse.json(
        { error: 'Invalid API key ID' },
        { status: 400 }
      );
    }

    // No need to check for init key here since frontend already prevents
    // init key from showing revoke button

    const result = await backendApiClient.revokeApiKey(backendAccountId, keyId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Revoke API key error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}