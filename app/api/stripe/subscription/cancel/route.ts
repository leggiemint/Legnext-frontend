import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { cancelSubscription, cancelSubscriptionImmediately, getActiveSubscriptions } from '@/libs/stripe-client';
import { getUserWithProfile, updateUserPlan } from '@/libs/user-helpers';
import { backendApiClient } from '@/libs/backend-api-client';

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId, immediate = false } = body;

    // 获取用户信息以验证订阅所有权
    const user = await getUserWithProfile(session.user.id);
    if (!user?.paymentCustomer?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'User has no payment customer' },
        { status: 404 }
      );
    }

    console.log(`🔍 [Cancel Subscription] Processing for user: ${user.email}`);

    let targetSubscriptionId = subscriptionId;

    // 如果没有提供subscriptionId，自动查找用户的活跃订阅
    if (!targetSubscriptionId) {
      console.log('🔍 [Cancel Subscription] No subscription ID provided, searching for active subscriptions...');
      
      const activeSubscriptions = await getActiveSubscriptions(user.paymentCustomer.stripeCustomerId);
      
      if (activeSubscriptions.length === 0) {
        return NextResponse.json(
          { error: 'No active subscription found' },
          { status: 404 }
        );
      }

      // 使用第一个活跃订阅
      targetSubscriptionId = activeSubscriptions[0].id;
      console.log(`✅ [Cancel Subscription] Found active subscription: ${targetSubscriptionId}`);
    }

    // 取消订阅
    console.log(`🔴 [Cancel Subscription] Canceling subscription: ${targetSubscriptionId} (immediate: ${immediate})`);
    
    const subscription = immediate
      ? await cancelSubscriptionImmediately(targetSubscriptionId)
      : await cancelSubscription(targetSubscriptionId);

    console.log(`✅ [Cancel Subscription] Subscription canceled successfully:`, {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });

    // 如果是立即取消，需要同步更新用户plan和backend
    if (immediate) {
      console.log(`🔄 [Cancel Subscription] Immediate cancellation - updating user plan and backend...`);
      
      try {
        // 更新用户plan为free
        await updateUserPlan(user.id, 'free');
        console.log(`✅ [Cancel Subscription] User plan updated to free`);

        // 同步到backend系统
        if (user.profile?.backendAccountId) {
          await backendApiClient.updateAccountPlan(
            user.profile.backendAccountId,
            'hobbyist'
          );
          console.log(`✅ [Cancel Subscription] Backend account downgraded to hobbyist plan`);
        }
      } catch (error) {
        console.error(`❌ [Cancel Subscription] Failed to sync plan changes:`, error);
        // 不抛出错误，因为Stripe取消已经成功
      }
    } else {
      console.log(`ℹ️ [Cancel Subscription] Subscription will be canceled at period end - no immediate plan changes needed`);
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at,
        ended_at: subscription.ended_at,
      },
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}