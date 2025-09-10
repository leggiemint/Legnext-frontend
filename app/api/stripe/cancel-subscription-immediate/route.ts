import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { reason } = body;

    // Get customer to find Stripe customer ID
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    });

    if (!customer?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    console.log(`🔍 [CANCEL-IMMEDIATE] Looking for active subscriptions for customer: ${customer.stripeCustomerId}`);

    let subscription = null;
    let canceledSubscription = null;

    try {
      // Get active subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.stripeCustomerId,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        subscription = subscriptions.data[0];
        console.log(`✅ [CANCEL-IMMEDIATE] Found active subscription: ${subscription.id}`);

        // Cancel the subscription immediately
        canceledSubscription = await stripe.subscriptions.cancel(subscription.id);

        console.log(`✅ [CANCEL-IMMEDIATE] Stripe subscription canceled: ${subscription.id}`);
      } else {
        console.log(`⚠️ [CANCEL-IMMEDIATE] No active Stripe subscription found, proceeding with local cancellation only`);
      }
    } catch (stripeError) {
      console.error(`⚠️ [CANCEL-IMMEDIATE] Stripe API error (continuing with local cancellation):`, stripeError.message);
      // 继续执行本地取消，即使Stripe API失败
    }

    // Update local database
    await prisma.subscription.updateMany({
      where: {
        customerId: customer.stripeCustomerId,
        status: 'active'
      },
      data: {
        status: 'canceled',
        cancelAtPeriodEnd: false,
        updatedAt: new Date()
      }
    });

    // Update user profile to free plan
    await prisma.userProfile.updateMany({
      where: {
        userId: session.user.id
      },
      data: {
        plan: 'free',
        subscriptionStatus: 'canceled',
        updatedAt: new Date()
      }
    });

    console.log(`🔄 [CANCEL-IMMEDIATE] Syncing cancellation to backend for user: ${session.user.email}`);

    // 🔄 同步取消状态到后端系统
    try {
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id }
      });

      const backendAccountId = userProfile?.preferences && typeof userProfile.preferences === 'object' && 'backendAccountId' in userProfile.preferences 
        ? (userProfile.preferences as any).backendAccountId 
        : null;
      
      if (backendAccountId) {
        console.log(`🔄 [CANCEL-IMMEDIATE] Downgrading backend account plan: ${backendAccountId}`);
        
        const { updateBackendAccountPlan } = await import('@/libs/backend-client');
        
        const planUpdateResult = await updateBackendAccountPlan({
          accountId: backendAccountId,
          newPlan: "hobbyist"
        });

        if (planUpdateResult.success) {
          console.log(`✅ [CANCEL-IMMEDIATE] Backend plan downgraded to hobbyist for account ${backendAccountId}`);
        } else {
          console.error(`⚠️ [CANCEL-IMMEDIATE] Failed to downgrade backend plan: ${planUpdateResult.error}`);
        }

        // 记录取消同步结果
        await prisma.transaction.create({
          data: {
            userId: session.user.id,
            type: "subscription_cancellation_immediate",
            amount: 0,
            description: "Immediate subscription cancellation with backend sync",
            status: planUpdateResult.success ? "completed" : "partial",
            gateway: "stripe",
            gatewayTxnId: subscription?.id || `local-cancel-${Date.now()}`,
            metadata: {
              backendAccountId: backendAccountId,
              planUpdateSuccess: planUpdateResult.success,
              planUpdateError: planUpdateResult.error,
              cancelReason: reason,
              canceledAt: new Date()
            }
          }
        });

      } else {
        console.log(`⚠️ [CANCEL-IMMEDIATE] No backend account ID found for user ${session.user.id}, skipping backend sync`);
      }

    } catch (backendError) {
      console.error(`❌ [CANCEL-IMMEDIATE] Backend cancellation sync failed:`, backendError);
      // 不抛出错误，因为前端取消已经成功
    }

    return NextResponse.json({
      success: true,
      message: canceledSubscription 
        ? "Subscription has been canceled immediately"
        : "Local subscription has been canceled (no active Stripe subscription found)",
      subscription: canceledSubscription ? {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceledAt: new Date(canceledSubscription.canceled_at! * 1000)
      } : {
        id: "local-cancellation",
        status: "canceled",
        canceledAt: new Date()
      }
    });

  } catch (error: any) {
    console.error("Stripe immediate cancel subscription error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
