import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { getBackendWallet } from "@/libs/backend-client";

export const dynamic = 'force-dynamic';

// GET /api/backend/wallet - 获取当前用户的详细钱包信息
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
        message: "No backend account found",
        data: {
          hasBackendAccount: false,
          frontendCredits: user.profile.credits,
          totalEarned: user.profile.totalCreditsEarned,
          totalSpent: user.profile.totalCreditsSpent,
          setupRequired: true
        }
      });
    }

    console.log(`💰 Fetching wallet details for account: ${backendAccountId}`);

    // 获取后端钱包信息
    const walletResult = await getBackendWallet(backendAccountId);

    if (!walletResult.success) {
      return NextResponse.json(
        { 
          error: "Failed to fetch wallet information", 
          details: walletResult.error,
          data: {
            hasBackendAccount: true,
            backendAccountId,
            frontendCredits: user.profile.credits,
            connectionError: true
          }
        },
        { status: 500 }
      );
    }

    const wallet = walletResult.wallet;
    const creditPacks = Array.isArray(wallet.credit_packs) ? wallet.credit_packs : [];

    // 计算credit packs统计信息
    const activePacks = creditPacks.filter((pack: any) => pack.active);
    const totalCapacity = activePacks.reduce((sum: number, pack: any) => sum + pack.capacity, 0);
    const totalUsed = activePacks.reduce((sum: number, pack: any) => sum + pack.used, 0);
    const totalFrozen = activePacks.reduce((sum: number, pack: any) => sum + pack.frozen, 0);
    const totalAvailable = totalCapacity - totalUsed - totalFrozen;

    // 计算总余额公式: $账户总余额=(remainPoints + remainCredits)/1000
    const remainPoints = wallet.point_remain || 0;
    const remainCredits = totalAvailable; // 这是所有active credit packs的可用余额
    const totalAccountBalance = (remainPoints + remainCredits) / 1000;

    // 按过期时间排序credit packs
    const sortedPacks = creditPacks
      .filter((pack: any) => pack.active)
      .sort((a: any, b: any) => new Date(a.expired_at).getTime() - new Date(b.expired_at).getTime());

    // 计算即将过期的packs（30天内）
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringPacks = sortedPacks.filter((pack: any) => 
      new Date(pack.expired_at) <= thirtyDaysFromNow && new Date(pack.expired_at) > new Date()
    );

    return NextResponse.json({
      message: "Wallet information retrieved successfully",
      data: {
        hasBackendAccount: true,
        backendAccountId,
        
        // 前端信息
        frontend: {
          credits: user.profile.credits,
          totalEarned: user.profile.totalCreditsEarned,
          totalSpent: user.profile.totalCreditsSpent
        },
        
        // 后端钱包基本信息
        backend: {
          walletId: wallet.id,
          accountId: wallet.account_id,
          pointRemain: wallet.point_remain,
          pointFrozen: wallet.point_frozen,
          pointUsed: wallet.point_used,
          createdAt: wallet.created_at,
          updatedAt: wallet.updated_at
        },

        // 总余额信息 (新的计算公式)
        balance: {
          remainPoints,
          remainCredits,
          totalAccountBalance,
          balanceFormula: "(remainPoints + remainCredits) / 1000",
          balanceInUSD: totalAccountBalance
        },
        
        // Credit Packs详细信息
        creditPacks: {
          total: creditPacks.length,
          active: activePacks.length,
          summary: {
            totalCapacity,
            totalUsed,
            totalFrozen,
            totalAvailable,
            utilizationRate: totalCapacity > 0 ? ((totalUsed / totalCapacity) * 100).toFixed(2) : 0
          },
          expiring: {
            count: expiringPacks.length,
            totalCapacity: expiringPacks.reduce((sum: number, pack: any) => sum + pack.capacity, 0),
            packs: expiringPacks.map((pack: any) => ({
              id: pack.id,
              capacity: pack.capacity,
              used: pack.used,
              available: pack.capacity - pack.used - pack.frozen,
              description: pack.description,
              expiresAt: pack.expired_at,
              daysUntilExpiry: Math.ceil((new Date(pack.expired_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            }))
          },
          details: sortedPacks.map((pack: any) => ({
            id: pack.id,
            capacity: pack.capacity,
            used: pack.used,
            frozen: pack.frozen,
            available: pack.capacity - pack.used - pack.frozen,
            description: pack.description,
            effectiveAt: pack.effective_at,
            expiresAt: pack.expired_at,
            createdAt: pack.created_at,
            updatedAt: pack.updated_at,
            isExpiring: expiringPacks.some((ep: any) => ep.id === pack.id)
          }))
        },
        
        // 自动充值设置
        autoRecharge: {
          enabled: wallet.auto_recharge_enabled,
          threshold: wallet.auto_recharge_threshold_credit,
          target: wallet.auto_recharge_target_credit,
          lastTriggered: wallet.last_auto_recharge_triggered_at
        },
        
        // 同步状态
        sync: {
          frontendBackendDifference: user.profile.credits - wallet.point_remain,
          lastSyncedAt: user.profile.preferences?.backendSyncedAt,
          recommendSync: Math.abs(user.profile.credits - wallet.point_remain) > 10
        }
      }
    });

  } catch (error: any) {
    console.error("💥 Error fetching wallet information:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}