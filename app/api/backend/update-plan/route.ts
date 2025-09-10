import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { updateBackendAccountPlan } from "@/libs/backend-client";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

// POST /api/backend/update-plan - 同步更新用户plan到后端系统
export async function POST(req: NextRequest) {
  try {
    // 用户认证检查
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - Login required" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // 确保用户只能操作自己的账户
    if (user.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden - Account mismatch" }, { status: 403 });
    }

    const body = await req.json();
    const { plan, syncToBackend = true } = body;

    // 输入验证
    if (!plan) {
      return NextResponse.json(
        { error: "Plan is required" },
        { status: 400 }
      );
    }

    // 验证plan值
    const validPlans = ["hobbyist", "developer", "free", "pro"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(", ")}` },
        { status: 400 }
      );
    }

    console.log(`📋 Updating plan to ${plan} for user: ${session.user.email}`);

    // 映射前端plan到后端plan
    let backendPlan: string;
    switch (plan) {
      case "hobbyist":
      case "free":
        backendPlan = "hobbyist";
        break;
      case "developer":
      case "pro":
        backendPlan = "developer";
        break;
      default:
        backendPlan = "hobbyist";
    }

    // 更新前端数据库的plan
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        plan: plan,
        preferences: {
          ...user.profile.preferences,
          planSyncedAt: new Date().toISOString()
        }
      }
    });

    let backendResult = null;
    const backendAccountId = user.profile.preferences?.backendAccountId;

    // 同步到后端系统（如果已配置）
    if (syncToBackend && backendAccountId) {
      console.log(`🔄 Syncing plan ${backendPlan} to backend account: ${backendAccountId}`);
      
      backendResult = await updateBackendAccountPlan({
        accountId: backendAccountId,
        plan: backendPlan
      });

      if (!backendResult.success) {
        console.error(`⚠️ Failed to sync plan to backend: ${backendResult.error}`);
        // 不返回错误，因为前端已成功更新
      }
    }

    // 创建同步记录
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "plan_change",
        amount: 0, // plan变更无金额变化
        description: `Plan changed from ${user.profile.plan} to ${plan}`,
        status: backendResult?.success ? "completed" : "partial",
        metadata: {
          oldPlan: user.profile.plan,
          newPlan: plan,
          backendPlan: backendPlan,
          backendAccountId: backendAccountId,
          backendSyncSuccess: backendResult?.success || false,
          backendError: backendResult?.error || null
        }
      }
    });

    return NextResponse.json({
      message: "Plan updated successfully",
      data: {
        oldPlan: user.profile.plan,
        newPlan: plan,
        backendPlan: backendPlan,
        frontendSuccess: true,
        backend: backendAccountId ? {
          synced: backendResult?.success || false,
          accountId: backendAccountId,
          error: backendResult?.error || null,
          account: backendResult?.account || null
        } : {
          configured: false,
          message: "Backend integration not configured"
        },
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("💥 Error updating plan:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/backend/update-plan - 获取当前plan状态
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const backendAccountId = user.profile.preferences?.backendAccountId;

    return NextResponse.json({
      data: {
        currentPlan: user.profile.plan,
        hasBackendAccount: !!backendAccountId,
        backendAccountId: backendAccountId,
        planSyncedAt: user.profile.preferences?.planSyncedAt,
        availablePlans: ["hobbyist", "developer"],
        canUpdatePlan: true
      }
    });

  } catch (error: any) {
    console.error("💥 Error getting plan status:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}