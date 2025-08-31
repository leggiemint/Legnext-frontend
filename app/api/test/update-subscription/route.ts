import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { updateSubscription, grantCredits } from "@/libs/user-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`🧪 Testing subscription update for user: ${userId}`);

    // Simulate what the webhook should do
    const mockCustomerId = `cus_test_${Date.now()}`;
    const mockPriceId = "price_1S1k2eKyeXh3bz3dL2jbl2VM"; // Your current price ID
    
    // Update subscription status
    const updateResult = await updateSubscription(
      userId,
      "pro",
      "active",
      mockCustomerId,
      mockPriceId,
      new Date(), // subscription start
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    );

    if (!updateResult.success) {
      console.error(`Failed to update subscription:`, updateResult.error);
      return NextResponse.json(
        { error: `Subscription update failed: ${updateResult.error}` },
        { status: 500 }
      );
    }

    // Grant Pro plan credits (200 credits)
    const creditResult = await grantCredits(
      userId,
      200,
      "Test Pro subscription credits",
      "stripe",
      `test_session_${Date.now()}`
    );

    if (!creditResult.success) {
      console.error(`Failed to grant credits:`, creditResult.error);
      return NextResponse.json(
        { error: `Credit grant failed: ${creditResult.error}` },
        { status: 500 }
      );
    }

    console.log(`✅ Test subscription activated for user ${userId}, new balance: ${creditResult.newBalance}`);

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      results: {
        subscriptionUpdate: updateResult,
        creditGrant: creditResult
      }
    });

  } catch (error: any) {
    console.error("Test subscription update error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
