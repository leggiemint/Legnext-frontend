import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// GET /api/debug/user-status - 调试用户状态
export async function GET(req: NextRequest) {
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
      debug: "User Status Debug Information",
      userId: user._id,
      email: user.email,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      hasAccess: user.hasAccess,
      customerId: user.customerId,
      priceId: user.priceId,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      credits: user.credits,
      // 最近的webhook事件
      recentWebhookEvents: user.webhookEvents?.slice(-5) || [],
      // 订阅历史
      subscriptionHistory: user.subscriptionHistory?.slice(-3) || [],
      // 原始用户对象（用于调试）
      rawUserData: {
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        hasAccess: user.hasAccess,
        webhookEventsCount: user.webhookEvents?.length || 0,
        subscriptionHistoryCount: user.subscriptionHistory?.length || 0
      }
    });

  } catch (error) {
    console.error("Debug user status error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/debug/user-status - 手动更新用户状态（用于测试）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();

    await connectMongo();
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "upgrade_to_pro") {
      // 手动升级为Pro（用于测试）
      user.plan = "pro";
      user.subscriptionStatus = "active";
      user.hasAccess = true;
      user.subscriptionStartDate = new Date();
      
      // 添加测试历史记录
      user.subscriptionHistory = user.subscriptionHistory || [];
      user.subscriptionHistory.push({
        action: 'upgraded',
        fromPlan: 'free',
        toPlan: 'pro',
        timestamp: new Date(),
        metadata: { source: 'manual_debug' }
      });
      
      await user.save();
      
      return NextResponse.json({
        message: "User manually upgraded to Pro",
        newStatus: {
          plan: user.plan,
          subscriptionStatus: user.subscriptionStatus,
          hasAccess: user.hasAccess
        }
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Debug user status update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
