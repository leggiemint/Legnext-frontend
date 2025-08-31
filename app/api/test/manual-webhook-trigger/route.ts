import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { updateSubscription, grantCredits } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";

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
    const { paymentId, amount, email } = body;

    if (!paymentId || !amount) {
      return NextResponse.json(
        { error: "Payment ID and amount are required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    console.log(`🔧 Manual webhook trigger for user: ${userId}, payment: ${paymentId}`);

    // 检查是否已处理过这个支付
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        gatewayTxnId: paymentId,
        gateway: "square"
      }
    });

    if (existingTransaction) {
      console.log(`⏭️ Payment ${paymentId} already processed`);
      return NextResponse.json({ 
        success: false, 
        message: "Payment already processed" 
      });
    }

    // 更新订阅状态
    const updateResult = await updateSubscription(
      userId,
      "pro",
      "active",
      paymentId, // 使用payment ID作为客户引用
      "pro-monthly-subscription"
    );

    if (!updateResult.success) {
      console.error(`Failed to update subscription:`, updateResult.error);
      throw new Error(`Subscription update failed: ${updateResult.error}`);
    }

    // 授予Pro计划积分 (200 credits - 用户已有60免费积分)
    const creditResult = await grantCredits(
      userId,
      200, // 200 credits for Pro subscription
      "Square Pro subscription purchase (manual trigger)",
      "square",
      paymentId
    );

    if (!creditResult.success) {
      console.error(`Failed to grant credits:`, creditResult.error);
      throw new Error(`Credit grant failed: ${creditResult.error}`);
    }

    console.log(`✅ Manual webhook trigger completed for user ${userId}, new balance: ${creditResult.newBalance}`);

    return NextResponse.json({
      success: true,
      message: "Manual webhook trigger completed successfully",
      userId: userId,
      newBalance: creditResult.newBalance,
      paymentId: paymentId
    });

  } catch (error: any) {
    console.error("Manual webhook trigger error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
