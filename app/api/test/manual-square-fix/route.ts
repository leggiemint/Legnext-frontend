import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { updateSubscription, grantCredits } from "@/libs/user-service";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`🔧 Manual Square subscription fix for user: ${userId}`);

    // 更新订阅状态到Pro
    const updateResult = await updateSubscription(
      userId,
      "pro",
      "active",
      `manual_square_${Date.now()}`, // 临时客户ID
      "square-pro-subscription"
    );

    if (!updateResult.success) {
      console.error(`Failed to update subscription:`, updateResult.error);
      throw new Error(`Subscription update failed: ${updateResult.error}`);
    }

    // 授予Pro计划积分 (200 credits)
    const creditResult = await grantCredits(
      userId,
      200,
      "Manual Square Pro subscription fix",
      "square",
      `manual_fix_${Date.now()}`
    );

    if (!creditResult.success) {
      console.error(`Failed to grant credits:`, creditResult.error);
      throw new Error(`Credit grant failed: ${creditResult.error}`);
    }

    console.log(`✅ Manual Square fix completed for user ${userId}, new balance: ${creditResult.newBalance}`);

    return NextResponse.json({
      success: true,
      message: "Square subscription manually activated!",
      data: {
        userId,
        plan: "pro",
        status: "active", 
        newCreditBalance: creditResult.newBalance,
        creditsAdded: 200
      }
    });

  } catch (error: any) {
    console.error("Manual Square fix error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fix subscription",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Manual Square subscription fix endpoint",
    usage: "POST to this endpoint while logged in to manually activate your Pro subscription after Square payment"
  });
}