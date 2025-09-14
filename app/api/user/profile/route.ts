import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { ensureUserProfile } from '@/libs/user-helpers';

import { log } from '@/libs/logger';
// 告诉Next.js这个API路由是动态的，不要在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // 验证用户认证
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 获取或创建用户profile
    const user = await ensureUserProfile(session.user.id, session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: 500 }
      );
    }

    // 返回格式化的用户信息
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      profile: {
        plan: user.profile?.plan || 'free',
        backendAccountId: user.profile?.backendAccountId,
        initApiKey: user.profile?.initApiKey,
        preferences: user.profile?.preferences || {},
      },
      paymentCustomer: {
        stripeCustomerId: user.paymentCustomer?.stripeCustomerId,
      },
    });

  } catch (error) {
    log.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}