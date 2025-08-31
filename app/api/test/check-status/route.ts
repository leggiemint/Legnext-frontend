import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get transaction history
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    // Get full user profile with all details
    const fullProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    });

    // Get recent webhook events for this user
    const webhookEvents = await prisma.webhookEvent.findMany({
      where: {
        OR: [
          { metadata: { path: ["customer_id"], equals: fullProfile?.stripeCustomerId } },
          { metadata: { path: ["client_reference_id"], equals: session.user.id } }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: session.user.email,
        plan: user.profile.plan,
        subscriptionStatus: user.profile.subscriptionStatus,
        credits: user.profile.credits,
        avatarsCreated: user.profile.avatarsCreated
      },
      fullProfile,
      recentTransactions: transactions,
      recentWebhooks: webhookEvents,
      debug: {
        sessionUserId: session.user.id,
        profileExists: !!fullProfile,
        transactionCount: transactions.length,
        webhookCount: webhookEvents.length
      }
    });

  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
