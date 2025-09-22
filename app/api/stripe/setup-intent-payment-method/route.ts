import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import { stripe, getOrCreateStripeCustomer } from '@/libs/stripe-client';
import { prisma } from '@/libs/prisma';

export async function POST() {
  try {
    console.log('🔧 Creating SetupIntent for payment method management...');

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 获取或创建 Stripe 客户
    const customerId = await getOrCreateStripeCustomer(
      session.user.id!,
      session.user.email!,
      session.user.name || undefined
    );

    // 确保在数据库中创建PaymentCustomer记录
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

    // 创建 SetupIntent 来收集支付方式（不收费） - 仅限卡片
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session', // 用于未来的支付
      // 仅允许卡片支付方式
      payment_method_types: ['card'] as const,
      // 专注于卡片支付方式配置
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic' as const,
          // Stripe 自动处理验证需求
        },
      },
      metadata: {
        userId: session.user.id!,
        type: 'payment_method_setup',
        userEmail: session.user.email!,
      },
    });

    console.log('✅ SetupIntent created successfully for payment method:', {
      id: setupIntent.id,
      customerId,
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId,
    });

  } catch (error: any) {
    console.error('❌ Error creating SetupIntent for payment method:', error);

    // 不在生产环境暴露内部错误详情
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Failed to create setup intent',
        ...(isDevelopment && { message: error.message }),
      },
      { status: 500 }
    );
  }
}