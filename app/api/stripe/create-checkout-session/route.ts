import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { createSubscriptionCheckoutSession, getOrCreateStripeCustomer, STRIPE_CONFIG } from '@/libs/stripe-client';
import { getUserWithProfile, updateStripeCustomerId } from '@/libs/user-helpers';

export async function POST(request: NextRequest) {
  try {
    console.log('🛒 Creating checkout session...');
    
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
    const { priceId, successUrl, cancelUrl } = body;

    console.log('📋 Request body:', { priceId, successUrl, cancelUrl });
    console.log('🔧 STRIPE_CONFIG.prices:', STRIPE_CONFIG.prices);

    // 验证价格ID
    if (!priceId) {
      console.log('❌ Price ID is required');
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // 验证是否为支持的价格
    const supportedPrices = Object.values(STRIPE_CONFIG.prices);
    console.log('✅ Supported prices:', supportedPrices);
    
    if (!supportedPrices.includes(priceId)) {
      console.log(`❌ Invalid price ID: ${priceId}. Supported: ${supportedPrices.join(', ')}`);
      return NextResponse.json(
        { error: 'Invalid price ID' },
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
    console.log('💾 Updating Stripe customer ID in database...');
    await updateStripeCustomerId(user.id, stripeCustomerId);
    console.log('✅ Stripe customer ID updated');

    // 5. 创建Checkout Session
    console.log('🛒 Creating checkout session with params:', {
      customerId: stripeCustomerId,
      priceId,
      userId: user.id,
      userEmail: user.email,
      successUrl,
      cancelUrl,
    });
    
    const checkoutSession = await createSubscriptionCheckoutSession({
      customerId: stripeCustomerId,
      priceId,
      userId: user.id,
      userEmail: user.email,
      successUrl,
      cancelUrl,
    });

    console.log('✅ Checkout session created:', {
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}