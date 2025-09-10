import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get customer to find Stripe customer ID
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    });

    if (!customer?.stripeCustomerId) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null
      });
    }

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripeCustomerId,
      status: 'all', // Get all subscriptions (active, canceled, etc.)
      limit: 10
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null
      });
    }

    // Get the most recent subscription
    const latestSubscription = subscriptions.data[0];
    
    // Get subscription details
    const subscriptionDetails = await stripe.subscriptions.retrieve(latestSubscription.id, {
      expand: ['items.data.price', 'latest_invoice']
    });

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscriptionDetails.id,
        status: subscriptionDetails.status,
        cancelAtPeriodEnd: subscriptionDetails.cancel_at_period_end,
        currentPeriodStart: new Date(subscriptionDetails.current_period_start * 1000),
        currentPeriodEnd: new Date(subscriptionDetails.current_period_end * 1000),
        canceledAt: subscriptionDetails.canceled_at ? new Date(subscriptionDetails.canceled_at * 1000) : null,
        price: {
          id: subscriptionDetails.items.data[0]?.price.id,
          amount: subscriptionDetails.items.data[0]?.price.unit_amount,
          currency: subscriptionDetails.items.data[0]?.price.currency,
          interval: subscriptionDetails.items.data[0]?.price.recurring?.interval
        },
        customerId: subscriptionDetails.customer
      }
    });

  } catch (error: any) {
    console.error("Stripe subscription status error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to get subscription status" },
      { status: 500 }
    );
  }
}
