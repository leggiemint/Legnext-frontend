import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { createTopUpCheckoutSession, getOrCreateStripeCustomer } from '@/libs/stripe-client';
import { getUserWithProfile, updateStripeCustomerId } from '@/libs/user-helpers';

export async function POST(request: NextRequest) {
  try {
    console.log('💰 Creating top-up checkout session...');
    
    // 1. 验证用户认证
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      console.log('❌ Authentication required');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, credits, successUrl, cancelUrl } = body;

    console.log('📋 Request body:', { amount, credits, successUrl, cancelUrl });

    // 验证参数
    if (!amount || !credits) {
      console.log('❌ Amount and credits are required');
      return NextResponse.json(
        { error: 'Amount and credits are required' },
        { status: 400 }
      );
    }

    // 2. 获取用户信息
    console.log(`👤 Getting user info for: ${session.user.id}`);
    const user = await getUserWithProfile(session.user.id);
    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    console.log('✅ User found:', { id: user.id, email: user.email, plan: user.profile?.plan });

    // 3. 创建或获取Stripe客户
    console.log('💳 Creating/getting Stripe customer...');
    const stripeCustomerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
      user.name || undefined
    );
    console.log('✅ Stripe customer ID:', stripeCustomerId);

    // 4. 更新前端数据库中的Stripe客户ID
    if (user.paymentCustomer?.stripeCustomerId !== stripeCustomerId) {
      console.log('💾 Updating Stripe customer ID in database...');
      await updateStripeCustomerId(user.id, stripeCustomerId);
    }

    // 5. 创建TopUp checkout session
    console.log('💰 Creating top-up checkout session...');
    const checkoutSession = await createTopUpCheckoutSession({
      customerId: stripeCustomerId,
      amount: amount * 100, // 转换为cents
      credits: credits,
      userId: user.id,
      userEmail: user.email,
      successUrl: successUrl || `${process.env.NEXTAUTH_URL}/app/credit-balance?success=true`,
      cancelUrl: cancelUrl || `${process.env.NEXTAUTH_URL}/app/credit-balance?canceled=true`,
    });

    console.log('✅ Top-up checkout session created:', {
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('Create top-up checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create top-up checkout session' },
      { status: 500 }
    );
  }
}
