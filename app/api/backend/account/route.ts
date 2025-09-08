import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";
import { createBackendAccount, validateBackendConfig } from "@/libs/backend-client";

export const dynamic = 'force-dynamic';

// POST /api/backend/account - 创建后端账户并同步
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 验证后端配置
    const configCheck = validateBackendConfig();
    if (!configCheck.isValid) {
      return NextResponse.json(
        { error: "Backend configuration invalid", details: configCheck.error },
        { status: 500 }
      );
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 检查是否已经有后端账户ID
    if (user.profile.preferences?.backendAccountId) {
      return NextResponse.json(
        { 
          error: "Backend account already exists", 
          accountId: user.profile.preferences.backendAccountId 
        },
        { status: 409 }
      );
    }

    const body = await req.json();
    const { plan, creditRemain, mjQuotaRemain } = body;

    console.log(`🚀 Creating backend account for user: ${user.email}`);

    // 创建后端账户
    const backendAccount = await createBackendAccount({
      email: user.email!,
      plan: plan || user.profile.plan,
      creditRemain: creditRemain || 1000, // 默认1000 credits
      mjQuotaRemain: mjQuotaRemain || 100
    });

    if (backendAccount.code !== 200) {
      return NextResponse.json(
        { error: "Failed to create backend account", details: backendAccount.message },
        { status: 500 }
      );
    }

    // 更新用户profile，保存后端账户信息
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        preferences: {
          ...user.profile.preferences,
          backendAccountId: backendAccount.data.id,
          backendAccountName: backendAccount.data.name,
          backendApiKey: backendAccount.data.api_keys[0]?.value || null,
          backendSyncedAt: new Date().toISOString()
        },
        // 同步credits余额到前端系统
        credits: backendAccount.data.wallet.point_remain || creditRemain || 1000,
        totalCreditsEarned: (user.profile.totalCreditsEarned || 0) + (creditRemain || 1000)
      }
    });

    // 创建同步交易记录
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "backend_sync",
        amount: creditRemain || 1000,
        description: "Backend account creation sync",
        status: "completed",
        metadata: {
          backendAccountId: backendAccount.data.id,
          backendAccountName: backendAccount.data.name,
          syncType: "create"
        }
      }
    });

    console.log(`✅ Backend account created and synced successfully for ${user.email}`);

    return NextResponse.json({
      message: "Backend account created successfully",
      data: {
        backendAccountId: backendAccount.data.id,
        backendAccountName: backendAccount.data.name,
        apiKey: backendAccount.data.api_keys[0]?.value || null,
        wallet: backendAccount.data.wallet,
        syncedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("💥 Error creating backend account:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error.message || "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// GET /api/backend/account - 获取当前用户的后端账户信息
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
    
    if (!backendAccountId) {
      return NextResponse.json(
        { 
          error: "No backend account found",
          hasBackendAccount: false 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        hasBackendAccount: true,
        backendAccountId,
        backendAccountName: user.profile.preferences?.backendAccountName,
        backendApiKey: user.profile.preferences?.backendApiKey,
        syncedAt: user.profile.preferences?.backendSyncedAt,
        currentCredits: user.profile.credits
      }
    });

  } catch (error: any) {
    console.error("💥 Error getting backend account info:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}