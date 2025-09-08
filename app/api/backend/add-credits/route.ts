import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile, grantCredits } from "@/libs/user-service";
import { updateBackendAccountCredits } from "@/libs/backend-client";

export const dynamic = 'force-dynamic';

// POST /api/backend/add-credits - 同时向前端和后端系统添加credits（仅限已认证用户）
export async function POST(req: NextRequest) {
  try {
    // 🔐 严格的用户认证检查
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - Login required" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // 🛡️ 确保用户只能操作自己的账户
    if (user.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden - Account mismatch" }, { status: 403 });
    }

    const body = await req.json();
    const { amount, description, syncToBackend = true, type = "manual" } = body;

    // 🔒 输入验证和安全限制
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // 安全限制：防止滥用
    if (amount > 10000) {
      return NextResponse.json(
        { error: "Amount exceeds maximum limit (10,000 credits)" },
        { status: 400 }
      );
    }

    // 特殊处理：新用户欢迎credits
    if (type === "welcome" && amount === 100) {
      if (user.profile.totalCreditsEarned > 0) {
        return NextResponse.json(
          { error: "Welcome credits already awarded" },
          { status: 400 }
        );
      }
    }

    console.log(`💰 Adding ${amount} credits to user: ${session.user.email}`);

    // 添加credits到前端系统
    const creditDescription = type === "welcome" 
      ? "Welcome bonus for new user"
      : (description || "Credit addition");
    
    const frontendResult = await grantCredits(
      session.user.id,
      amount,
      creditDescription,
      type === "welcome" ? "welcome_bonus" : "manual",
      null
    );

    if (!frontendResult.success) {
      return NextResponse.json(
        { error: "Failed to add credits to frontend", details: frontendResult.error },
        { status: 500 }
      );
    }

    let backendResult = null;
    const backendAccountId = user.profile.preferences?.backendAccountId;

    // 同步到后端系统（如果已配置）
    if (syncToBackend && backendAccountId) {
      console.log(`🔄 Syncing ${amount} credits to backend account: ${backendAccountId}`);
      
      backendResult = await updateBackendAccountCredits({
        accountId: backendAccountId,
        amount: amount,
        description: description || "Credit addition from frontend"
      });

      if (!backendResult.success) {
        console.error(`⚠️ Failed to sync to backend: ${backendResult.error}`);
        // 不返回错误，因为前端已成功添加
      }
    }

    return NextResponse.json({
      message: type === "welcome" ? "Welcome credits granted successfully" : "Credits added successfully",
      data: {
        type: type,
        amount: amount,
        newFrontendBalance: frontendResult.newBalance,
        frontendSuccess: true,
        backend: backendAccountId ? {
          synced: backendResult?.success || false,
          accountId: backendAccountId,
          error: backendResult?.error || null,
          wallet: backendResult?.wallet || null
        } : {
          configured: false,
          message: "Backend integration not configured"
        },
        addedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("💥 Error adding credits:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/backend/add-credits - 获取当前credits状态
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
        currentBalance: user.profile.credits,
        totalEarned: user.profile.totalCreditsEarned,
        totalSpent: user.profile.totalCreditsSpent,
        hasBackendAccount: !!backendAccountId,
        backendAccountId: backendAccountId,
        canAddCredits: true,
        minimumAmount: 1,
        maximumAmount: 10000 // 可根据需要调整
      }
    });

  } catch (error: any) {
    console.error("💥 Error getting credits status:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}