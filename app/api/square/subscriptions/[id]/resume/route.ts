import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { resumeSquareSubscription } from "@/libs/square-subscriptions";
import { prisma } from "@/libs/prisma";

export async function POST(
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

    console.log('▶️ Resuming Square subscription:', {
      subscriptionId,
      userEmail: session.user.email
    });

    // Verify the subscription belongs to the current user
    const subscription = await prisma.subscription.findFirst({
      where: {
        squareSubscriptionId: subscriptionId,
        user: { email: session.user.email }
      }
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Resume the subscription using Square API
    const result = await resumeSquareSubscription(subscriptionId);

    console.log('✅ Square subscription resumed successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Subscription resumed successfully',
      subscriptionId: result.subscriptionId,
      status: result.status
    });

  } catch (error) {
    console.error('❌ Failed to resume Square subscription:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to resume subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}