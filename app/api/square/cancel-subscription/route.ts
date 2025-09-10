import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import { cancelSquareSubscription } from "@/libs/square";
import { updateBackendAccountPlan } from "@/libs/backend-client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔴 Square subscription cancellation requested by user:", session.user.id);

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        profile: true,
        customers: true 
      }
    });

    if (!user || !user.profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 检查用户当前是否有活跃订阅
    if (user.profile.plan !== 'pro' || user.profile.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { error: "No active subscription found to cancel" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { reason, feedback } = body;

    console.log("📝 Cancellation details:", {
      userId: user.id,
      currentPlan: user.profile.plan,
      subscriptionStatus: user.profile.subscriptionStatus,
      reason: reason || 'No reason provided',
      feedback: feedback || 'No feedback provided'
    });

    // Square的订阅取消逻辑
    // 注意：由于我们使用Payment Link方式，这里主要是更新数据库状态
    const subscriptionId = user.id; // 使用用户ID作为标识，Square customer ID支持待实现
    
    try {
      // 调用Square取消订阅（目前是状态更新方式）
      const cancelResult = await cancelSquareSubscription(subscriptionId);
      
      if (!cancelResult) {
        console.error("❌ Failed to cancel Square subscription");
        return NextResponse.json(
          { error: "Failed to cancel subscription with Square" },
          { status: 500 }
        );
      }

      console.log("✅ Square subscription cancellation processed");

    } catch (squareError: any) {
      console.error("❌ Square API error during cancellation:", squareError);
      // 继续处理，因为我们主要依赖数据库状态管理
    }

    // 更新用户订阅状态到数据库
    const canceledAt = new Date();
    
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        subscriptionStatus: 'canceled',
        plan: 'free', // 立即降级到免费计划
        // 保留当前credits，让用户使用完
        preferences: {
          ...(user.profile.preferences as any || {}),
          canceledAt: canceledAt.toISOString(),
          cancelReason: reason || 'User requested',
          cancelFeedback: feedback || null,
          lastActivePlan: 'pro',
          canceledByUser: true
        }
      }
    });

    // 同步到后端系统（从pro降级到free，即developer降级到hobbyist）
    try {
      const backendAccountId = (user.profile.preferences as any)?.backendAccountId;
      const backendResult = await updateBackendAccountPlan({
        accountId: backendAccountId || undefined,
        email: !backendAccountId ? user.email : undefined, // 只有没有accountId时才使用email
        newPlan: 'hobbyist' // 免费计划在后端是hobbyist
      });

      if (backendResult.success) {
        console.log("✅ Backend plan updated to hobbyist after cancellation");
      } else {
        console.warn("⚠️ Backend plan update failed, but local cancellation succeeded:", backendResult.error);
      }
    } catch (backendError: any) {
      console.warn("⚠️ Backend synchronization failed during cancellation:", backendError.message);
      // 不阻止取消流程
    }

    // 记录取消事件
    try {
      await prisma.webhookEvent.create({
        data: {
          id: `cancel_${user.id}_${Date.now()}`,
          provider: 'square',
          eventId: `cancel_${user.id}_${Date.now()}`,
          eventType: 'subscription.canceled',
          metadata: {
            userId: user.id,
            email: user.email,
            plan: 'pro',
            canceledAt: canceledAt.toISOString(),
            reason: reason,
            feedback: feedback,
            source: 'user_initiated'
          },
          processed: true,
          processedAt: canceledAt
        }
      });
    } catch (logError) {
      console.warn("⚠️ Failed to log cancellation event:", logError);
      // 不影响主要流程
    }

    const result = {
      success: true,
      message: "Subscription canceled successfully",
      details: {
        canceledAt: canceledAt.toISOString(),
        newPlan: 'free',
        creditsRetained: user.profile.apiCalls, // 用户保留现有credits
        effectiveImmediately: true
      }
    };

    console.log("✅ Square subscription cancellation completed:", result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("❌ Square subscription cancellation failed:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to cancel subscription",
        details: "Please contact support if this issue persists"
      },
      { status: 500 }
    );
  }
}