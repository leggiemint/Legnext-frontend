import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/debug/webhooks - 调试webhook事件记录
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();
    
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: user._id,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      hasAccess: user.hasAccess,
      customerId: user.customerId,
      priceId: user.priceId,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      // 最近的webhook事件
      recentWebhookEvents: user.webhookEvents?.slice(-5) || [],
      // 订阅历史
      subscriptionHistory: user.subscriptionHistory?.slice(-3) || [],
      // 积分信息
      credits: user.credits
    });

  } catch (error) {
    console.error("Debug webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
