import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import { stripe, getOrCreateStripeCustomer } from '@/libs/stripe-client';
import { prisma } from '@/libs/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creating SetupIntent for subscription...');

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { priceId, userPlan } = await request.json();
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // 检查用户是否已有活跃订阅（从前端传递的用户计划信息）
    if (userPlan === 'pro') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // 获取或创建 Stripe 客户
    const customerId = await getOrCreateStripeCustomer(
      session.user.id!,
      session.user.email!,
      session.user.name || undefined
    );

    // 确保在数据库中创建PaymentCustomer记录（webhook处理需要）
    await prisma.paymentCustomer.upsert({
      where: { userId: session.user.id! },
      update: {
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id!,
        stripeCustomerId: customerId,
      },
    });

    // 获取价格信息（用于返回给前端显示）
    const price = await stripe.prices.retrieve(priceId);
    if (!price.unit_amount) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      );
    }

    // 创建 SetupIntent 来收集支付方式（仅支持卡片支付）
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session', // 用于未来的订阅支付
      payment_method_types: ['card'], // 仅支持卡片支付
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic' as const,
          // Stripe 自动根据地区、风险等因素决定是否需要 3D Secure
        },
      },
      metadata: {
        userId: session.user.id!,
        priceId: priceId,
        type: 'subscription_setup',
        userEmail: session.user.email!,
      },
    });

    console.log('✅ SetupIntent created successfully:', {
      id: setupIntent.id,
      customerId,
      priceId,
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId,
      amount: price.unit_amount,
      currency: price.currency,
      priceId,
    });

  } catch (error: any) {
    console.error('❌ Error creating SetupIntent:', error);

    return NextResponse.json(
      {
        error: 'Failed to create setup intent',
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}