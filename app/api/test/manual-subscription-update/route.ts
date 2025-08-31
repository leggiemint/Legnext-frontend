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
    console.log(`🧪 Manual subscription update for user: ${userId}`);

    // 模拟Stripe webhook的订阅更新逻辑
    const mockCustomerId = `cus_test_${Date.now()}`;
    const mockPriceId = "price_1S1k2eKyeXh3bz3dL2jbl2VM";
    
    // 更新订阅状态
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

    // 授予Pro计划积分
    const creditResult = await grantCredits(
      userId,
      200,
      "Manual Pro subscription test credits",
      "stripe",
      `manual_test_${Date.now()}`
    );

    if (!creditResult.success) {
      console.error(`Failed to grant credits:`, creditResult.error);
      return NextResponse.json(
        { error: `Credit grant failed: ${creditResult.error}` },
        { status: 500 }
      );
    }

    console.log(`✅ Manual subscription update successful for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Subscription manually updated to Pro",
      results: {
        subscriptionUpdate: updateResult,
        creditGrant: creditResult
      }
    });

  } catch (error: any) {
    console.error("Manual subscription update error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
