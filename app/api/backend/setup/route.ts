import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile, createUserBackendAccount } from "@/libs/user-service";

export const dynamic = 'force-dynamic';

// POST /api/backend/setup - 为当前用户设置后端账户集成
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 检查是否已经有后端账户
    if (user.profile.preferences?.backendAccountId) {
      return NextResponse.json({
        message: "Backend account already exists",
        data: {
          hasBackendAccount: true,
          backendAccountId: user.profile.preferences.backendAccountId,
          backendAccountName: user.profile.preferences.backendAccountName,
          syncedAt: user.profile.preferences.backendSyncedAt
        }
      });
    }

    console.log(`🔧 Setting up backend integration for user: ${session.user.email}`);

    // 创建后端账户
    const result = await createUserBackendAccount(
      session.user.id, 
      session.user.email,
      user.profile.plan
    );

    if (!result.success) {
      // 如果是因为后端未配置而失败，返回友好信息
      if (result.error === "Backend not configured") {
        return NextResponse.json({
          message: "Backend integration is not configured",
          data: {
            hasBackendAccount: false,
            backendConfigured: false,
            reason: "Backend system URL not configured in environment variables"
          }
        });
      }

      return NextResponse.json(
        { error: "Failed to create backend account", details: result.error },
        { status: 500 }
      );
    }

    // 重新获取更新后的用户信息
    const updatedUser = await getUserWithProfile(session.user.id);

    return NextResponse.json({
      message: "Backend account setup completed successfully",
      data: {
        hasBackendAccount: true,
        backendAccountId: result.backendAccountId,
        backendAccountName: updatedUser?.profile.preferences?.backendAccountName,
        currentCredits: updatedUser?.profile.credits,
        syncedAt: updatedUser?.profile.preferences?.backendSyncedAt
      }
    });

  } catch (error: any) {
    console.error("💥 Error setting up backend integration:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/backend/setup - 检查当前用户的后端集成状态
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

    const hasBackendAccount = !!user.profile.preferences?.backendAccountId;

    return NextResponse.json({
      data: {
        hasBackendAccount,
        backendAccountId: user.profile.preferences?.backendAccountId || null,
        backendAccountName: user.profile.preferences?.backendAccountName || null,
        backendApiKey: hasBackendAccount ? "***hidden***" : null,
        syncedAt: user.profile.preferences?.backendSyncedAt || null,
        currentCredits: user.profile.credits,
        userPlan: user.profile.plan,
        setupRequired: !hasBackendAccount
      }
    });

  } catch (error: any) {
    console.error("💥 Error checking backend setup status:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}