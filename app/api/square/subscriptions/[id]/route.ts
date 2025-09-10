import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getSquareSubscription } from "@/libs/square-subscriptions";
import { prisma } from "@/libs/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptionId = params.id;
    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    console.log('🔍 Getting Square subscription details:', {
      subscriptionId,
      userEmail: session.user.email
    });

    // Verify the subscription belongs to the current user
    const localSubscription = await prisma.subscription.findFirst({
      where: {
        squareSubscriptionId: subscriptionId,
        user: { email: session.user.email }
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    if (!localSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Get full subscription details from Square API
    const squareSubscription = await getSquareSubscription(subscriptionId);

    // Combine local and Square data
    const subscriptionDetails = {
      id: localSubscription.id,
      subscriptionId: localSubscription.squareSubscriptionId,
      name: localSubscription.name,
      status: localSubscription.status,
      platform: localSubscription.platform,
      currentPeriodStart: localSubscription.currentPeriodStart,
      currentPeriodEnd: localSubscription.currentPeriodEnd,
      nextInvoiceDate: localSubscription.nextInvoiceDate,
      cancelAtPeriodEnd: localSubscription.cancelAtPeriodEnd,
      createdAt: localSubscription.createdAt,
      user: localSubscription.user,
      squareDetails: {
        id: squareSubscription.id,
        status: squareSubscription.status,
        startDate: squareSubscription.startDate,
        chargedThroughDate: squareSubscription.chargedThroughDate,
        canceledDate: squareSubscription.canceledDate,
        planVariationId: squareSubscription.planVariationId,
        customerId: squareSubscription.customerId,
        locationId: squareSubscription.locationId,
        timezone: squareSubscription.timezone || 'America/New_York'
      }
    };

    console.log('✅ Square subscription details retrieved successfully');

    return NextResponse.json(subscriptionDetails);

  } catch (error) {
    console.error('❌ Failed to get Square subscription details:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve subscription details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}