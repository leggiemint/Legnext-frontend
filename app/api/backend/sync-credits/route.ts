import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";
import { getBackendWallet, calculateAvailableCredits } from "@/libs/backend-client";

export const dynamic = 'force-dynamic';

// POST /api/backend/sync-credits - 手动同步credits余额（简洁版）
export async function POST(req: NextRequest) {
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
        { error: "No backend account found. Please create backend account first." },
        { status: 404 }
      );
    }

    // 简化：只支持从后端同步到前端
    const body = await req.json();
    const { forceSync = false } = body;

    console.log(`🔄 [MANUAL-SYNC] Starting manual credits sync for user: ${user.email}${forceSync ? ' (forced)' : ''}`);
    console.log(`🔍 [DEBUG] Current frontend credits: ${user.profile.credits}`);
    console.log(`🔍 [DEBUG] Backend account ID: ${backendAccountId}`);

    // 🎯 使用专门的钱包API获取完整的credit_packs数据
    const walletResult = await getBackendWallet(backendAccountId);
    console.log(`🔍 [DEBUG] Wallet API success: ${walletResult.success}`);
    
    if (!walletResult.success || !walletResult.wallet) {
      console.log(`❌ [ERROR] Wallet API error: ${walletResult.error}`);
      return NextResponse.json(
        { error: "Failed to fetch backend wallet", details: walletResult.error },
        { status: 500 }
      );
    }

    // 🎯 正确计算credits：从credit_packs计算可用余额
    const backendCredits = calculateAvailableCredits(walletResult.wallet);
    const currentFrontendCredits = user.profile.credits;
    
    const creditPacks = walletResult.wallet.credit_packs || [];
    console.log(`🔍 [DEBUG] Wallet API point_remain: ${walletResult.wallet.point_remain}`);
    console.log(`🔍 [DEBUG] Credit packs found: ${creditPacks.length}`);
    if (Array.isArray(creditPacks)) {
      creditPacks.forEach((pack: any, index: number) => {
        console.log(`🔍 [DEBUG] Pack ${index + 1}: capacity=${pack.capacity}, used=${pack.used}, available=${pack.capacity - pack.used}, active=${pack.active}`);
      });
    }
    console.log(`🔍 [DEBUG] Calculated backend credits: ${backendCredits}`);
    console.log(`🔍 [DEBUG] Frontend credits: ${currentFrontendCredits}`);
    console.log(`🔍 [DEBUG] Credits difference: ${backendCredits - currentFrontendCredits}`);
    
    // 如果余额相同且非强制同步，跳过更新
    if (!forceSync && backendCredits === currentFrontendCredits) {
      console.log(`🔍 [DEBUG] Credits already in sync, skipping update`);
      return NextResponse.json({
        message: "Credits already in sync",
        data: {
          credits: backendCredits,
          syncRequired: false,
          syncedAt: new Date().toISOString()
        }
      });
    }

    const creditsDiff = backendCredits - currentFrontendCredits;
    
    console.log(`🔄 [SYNC] Proceeding with sync: ${creditsDiff > 0 ? 'adding' : 'deducting'} ${Math.abs(creditsDiff)} credits`);

    // 更新前端credits
    await prisma.$transaction(async (tx) => {
      console.log(`🔍 [DEBUG] Starting database transaction...`);
      await tx.userProfile.update({
        where: { userId: user.id },
        data: {
          credits: backendCredits,
          apiCalls: backendCredits, // 保持兼容
          ...(creditsDiff < 0 && {
            totalCreditsSpent: user.profile.totalCreditsSpent + Math.abs(creditsDiff)
          }),
          ...(creditsDiff > 0 && {
            totalCreditsEarned: user.profile.totalCreditsEarned + creditsDiff
          }),
          preferences: {
            ...user.profile.preferences,
            backendSyncedAt: new Date().toISOString()
          }
        }
      });

      // 记录同步交易
      if (creditsDiff !== 0) {
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: creditsDiff > 0 ? "credit_sync_add" : "credit_sync_deduct", 
            amount: creditsDiff,
            description: `Manual sync from backend: ${currentFrontendCredits} → ${backendCredits}`,
            status: "completed",
            metadata: {
              syncType: "manual_sync",
              backendAccountId,
              previousCredits: currentFrontendCredits,
              newCredits: backendCredits,
              trigger: "user_manual_refresh"
            }
          }
        });
      }
      
      console.log(`🔍 [DEBUG] UserProfile updated successfully`);
      console.log(`🔍 [DEBUG] Transaction record created with type: ${creditsDiff > 0 ? 'credit_sync_add' : 'credit_sync_deduct'}`);
    });

    console.log(`✅ [MANUAL-SYNC] Manual sync completed successfully for ${user.email}`);
    console.log(`🔍 [DEBUG] Final result: ${currentFrontendCredits} → ${backendCredits} (${creditsDiff > 0 ? '+' : ''}${creditsDiff})`);

    return NextResponse.json({
      message: "Credits synced successfully",
      data: {
        previousCredits: currentFrontendCredits,
        newCredits: backendCredits,
        creditDifference: creditsDiff,
        syncedAt: new Date().toISOString()
      },
      debug: {
        syncType: "manual",
        forceSync: forceSync,
        backendAccountId: backendAccountId,
        walletApiSuccess: walletResult.success
      }
    });

  } catch (error: any) {
    console.error("💥 Error syncing credits:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/backend/sync-credits - 获取credits同步状态
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
      return NextResponse.json({
        data: {
          hasBackendAccount: false,
          frontendCredits: user.profile.credits,
          backendCredits: null,
          lastSyncedAt: null,
          syncRequired: false
        }
      });
    }

    // 获取后端credits余额
    const walletResult = await getBackendWallet(backendAccountId);
    let backendCredits = null;
    
    if (walletResult.success && walletResult.wallet) {
      // 🎯 正确计算credits：从credit_packs计算可用余额
      backendCredits = calculateAvailableCredits(walletResult.wallet);
    }

    const frontendCredits = user.profile.credits;
    const lastSyncedAt = user.profile.preferences?.backendSyncedAt;
    const syncRequired = backendCredits !== null && backendCredits !== frontendCredits;

    return NextResponse.json({
      data: {
        hasBackendAccount: true,
        backendAccountId,
        frontendCredits,
        backendCredits,
        creditsDifference: backendCredits !== null ? backendCredits - frontendCredits : null,
        lastSyncedAt,
        syncRequired
      }
    });

  } catch (error: any) {
    console.error("💥 Error getting sync status:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}