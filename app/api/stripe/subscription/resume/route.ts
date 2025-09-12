import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { resumeSubscription } from '@/libs/stripe-client';
import { getUserWithProfile } from '@/libs/user-helpers';

export async function POST() {
  try {
    // 验证用户认证
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 获取用户信息以验证订阅所有权
    const user = await getUserWithProfile(session.user.id);
    if (!user?.paymentCustomer?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'User has no payment customer' },
        { status: 404 }
      );
    }

    // 获取用户的所有订阅，找到需要恢复的订阅
    const { stripe } = await import('@/libs/stripe-client');
    const subscriptions = await stripe.subscriptions.list({
      customer: user.paymentCustomer.stripeCustomerId,
      status: 'all',
      limit: 10,
    });

    // 找到设置为在周期结束时取消的活跃订阅
    const subscriptionToResume = subscriptions.data.find(
      sub => sub.status === 'active' && sub.cancel_at_period_end === true
    );

    if (!subscriptionToResume) {
      return NextResponse.json(
        { error: 'No subscription found that is set to cancel at period end' },
        { status: 404 }
      );
    }

    console.log(`Resuming subscription ${subscriptionToResume.id} for user ${session.user.id}`);

    // 恢复订阅
    const subscription = await resumeSubscription(subscriptionToResume.id);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at,
      },
    });

  } catch (error) {
    console.error('Resume subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}