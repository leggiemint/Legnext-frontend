import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { linkExistingBackendAccount } from '@/libs/user-helpers';

// 告诉Next.js这个API路由是动态的，不要在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    console.log(`🔗 [Link Backend Account] Attempting to link account for user: ${session.user.id}`);

    const linkedUser = await linkExistingBackendAccount(session.user.id, apiKey);

    if (!linkedUser) {
      return NextResponse.json(
        { error: 'Failed to link backend account. Please check your API key.' },
        { status: 400 }
      );
    }

    console.log(`✅ [Link Backend Account] Successfully linked account for user: ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Backend account linked successfully',
      account: {
        backendAccountId: linkedUser.profile?.backendAccountId,
        plan: linkedUser.profile?.plan,
        linkedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ [Link Backend Account] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to link backend account' },
      { status: 500 }
    );
  }
}