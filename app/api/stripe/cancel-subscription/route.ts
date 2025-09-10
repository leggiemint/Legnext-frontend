import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
    const { reason, cancelAtPeriodEnd = true } = body;

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

    // Get active subscriptions for this customer
    let subscriptions;
    try {
      subscriptions = await stripe.subscriptions.list({
        customer: customer.stripeCustomerId,
        status: 'active',
        limit: 1
      });
    } catch (stripeError: any) {
      // Handle invalid customer ID
      if (stripeError.code === 'resource_missing' && stripeError.param === 'customer') {
        console.log(`⚠️ Invalid Stripe customer ID: ${customer.stripeCustomerId}, checking local subscriptions`);
        
        // Check if we have local subscription records
        const localSubscriptions = await prisma.subscription.findMany({
          where: {
            userId: session.user.id,
            status: 'active',
            platform: 'stripe'
          }
        });
        
        if (localSubscriptions.length === 0) {
          return NextResponse.json(
            { error: "No active subscription found" },
            { status: 400 }
          );
        }
        
        // Update local subscription status to canceled
        await prisma.subscription.updateMany({
          where: {
            userId: session.user.id,
            status: 'active',
            platform: 'stripe'
          },
          data: {
            status: cancelAtPeriodEnd ? 'active' : 'canceled',
            cancelAtPeriodEnd: cancelAtPeriodEnd
          }
        });
        
        // Update user profile
        await prisma.userProfile.updateMany({
          where: { userId: session.user.id },
          data: {
            plan: 'free',
            subscriptionStatus: 'canceled'
          }
        });
        
        return NextResponse.json({
          success: true,
          message: "Subscription canceled (local only - Stripe customer not found)",
          subscription: {
            id: localSubscriptions[0].id,
            status: cancelAtPeriodEnd ? 'active' : 'canceled',
            cancelAtPeriodEnd: cancelAtPeriodEnd,
            currentPeriodEnd: localSubscriptions[0].currentPeriodEnd
          }
        });
      }
      
      // Re-throw other Stripe errors
      throw stripeError;
    }

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    const subscription = subscriptions.data[0];

    // Cancel the subscription
    const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: cancelAtPeriodEnd,
      metadata: {
        cancellation_reason: reason || 'User requested cancellation',
        canceled_by: 'user'
      }
    });

    // Update local database
    await prisma.subscription.updateMany({
      where: {
        customerId: customer.stripeCustomerId,
        status: 'active'
      },
      data: {
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
        cancelAtPeriodEnd: cancelAtPeriodEnd
      }
    });

    // 记录取消操作
    console.log(`ℹ️ [CANCEL] Subscription marked for period-end cancellation, backend sync will happen via webhook when actually canceled`);
    
    // 记录取消操作到数据库
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "subscription_cancellation",
        amount: 0,
        description: "Subscription marked for cancellation at period end",
        status: "completed",
        gateway: "stripe",
        gatewayTxnId: subscription.id,
        metadata: {
          cancelReason: reason,
          cancelAtPeriodEnd: cancelAtPeriodEnd,
          canceledAt: new Date()
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: cancelAtPeriodEnd 
        ? "Subscription will be canceled at the end of the current period"
        : "Subscription has been canceled immediately",
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
        currentPeriodEnd: new Date(canceledSubscription.current_period_end * 1000)
      }
    });

  } catch (error: any) {
    console.error("Stripe cancel subscription error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
