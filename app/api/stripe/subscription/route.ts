import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { stripe } from '@/libs/stripe-client';
import { getUserWithProfile } from '@/libs/user-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 验证用户认证
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await getUserWithProfile(session.user.id);
    if (!user?.paymentCustomer?.stripeCustomerId) {
      return NextResponse.json({
        subscriptions: [],
        hasActiveSubscription: false,
      });
    }

    // 获取客户的所有订阅
    const subscriptions = await stripe.subscriptions.list({
      customer: user.paymentCustomer.stripeCustomerId,
      status: 'all',
      expand: ['data.latest_invoice', 'data.items.data.price'],
    });

    // 格式化订阅数据
    const formattedSubscriptions = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: sub.canceled_at,
      ended_at: sub.ended_at,
      price: {
        id: sub.items.data[0]?.price?.id,
        amount: sub.items.data[0]?.price?.unit_amount,
        currency: sub.items.data[0]?.price?.currency,
        interval: sub.items.data[0]?.price?.recurring?.interval,
      },
      latest_invoice: sub.latest_invoice,
    }));

    // 检查是否有活跃订阅
    const hasActiveSubscription = subscriptions.data.some(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      hasActiveSubscription,
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}