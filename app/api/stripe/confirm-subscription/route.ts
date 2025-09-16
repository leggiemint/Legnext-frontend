import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import { stripe } from '@/libs/stripe-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creating subscription after SetupIntent confirmation...');

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { setupIntentId, priceId } = await request.json();
    if (!setupIntentId) {
      return NextResponse.json(
        { error: 'Setup intent ID is required' },
        { status: 400 }
      );
    }
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // 获取 SetupIntent 信息
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment setup not completed' },
        { status: 400 }
      );
    }

    // 获取支付方式
    const paymentMethod = setupIntent.payment_method as string;
    const customerId = setupIntent.customer as string;

    // 设置为默认支付方式
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod,
      },
    });

    // 创建订阅（Stripe 会立即收取第一笔费用）
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethod,
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: session.user.id!,
        userEmail: session.user.email!,
      },
    });

    console.log('✅ Subscription created successfully:', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    });

    // 更新数据库中的订阅信息（通过 webhook 处理，这里只是预备更新）
    // 实际订阅状态将由 webhook 处理完成

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
    });

  } catch (error: any) {
    console.error('❌ Error confirming subscription:', error);

    return NextResponse.json(
      {
        error: 'Failed to confirm subscription',
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}