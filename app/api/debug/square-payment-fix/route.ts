import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { updateSubscription, grantCredits } from "@/libs/user-service";

export async function POST() {
  try {
    console.log("🔧 Starting Square payment fix for user cmf0796i100088czqf6dbyil9");

    const userId = "cmf0796i100088czqf6dbyil9"; // Your user ID from logs
    const userEmail = "huik99298@gmail.com";

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`👤 Found user: ${user.email}, current plan: ${user.profile?.plan || 'unknown'}`);

    // 更新订阅状态到Pro
    const updateResult = await updateSubscription(
      userId,
      "pro",
      "active",
      `square_manual_fix_${Date.now()}`,
      "square-pro-subscription"
    );

    if (!updateResult.success) {
      console.error(`❌ Failed to update subscription:`, updateResult.error);
      throw new Error(`Subscription update failed: ${updateResult.error}`);
    }

    // 授予Pro计划积分 (200 credits)
    const creditResult = await grantCredits(
      userId,
      200,
      "Square Pro subscription - Manual Fix",
      "square",
      `manual_fix_${Date.now()}`
    );

    if (!creditResult.success) {
      console.error(`❌ Failed to grant credits:`, creditResult.error);
      throw new Error(`Credit grant failed: ${creditResult.error}`);
    }

    // 记录这次手动修复
    await prisma.transaction.create({
      data: {
        userId,
        type: "subscription",
        amount: 200, // 积分数量
        description: "Square Pro subscription activated (manual fix after payment success)",
        gateway: "square",
        gatewayTxnId: `manual_fix_${Date.now()}`,
        status: "completed",
        metadata: {
          source: "manual_square_fix",
          originalPaymentAmount: 0.01,
          reason: "Square webhook failed to trigger after successful payment"
        }
      }
    });

    console.log(`✅ Square subscription manually activated for ${userEmail}`);
    console.log(`✅ New credit balance: ${creditResult.newBalance}`);

    return NextResponse.json({
      success: true,
      message: "Square Pro subscription activated successfully!",
      data: {
        userId,
        email: userEmail,
        plan: "pro",
        subscriptionStatus: "active", 
        newCreditBalance: creditResult.newBalance,
        creditsAdded: 200,
        totalCredits: creditResult.newBalance
      }
    });

  } catch (error: any) {
    console.error("❌ Square payment fix error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to activate subscription",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Square payment manual fix endpoint",
    description: "POST to activate Square Pro subscription for user cmf0796i100088czqf6dbyil9",
    userEmail: "huik99298@gmail.com"
  });
}