import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { getBackendCreditPacks } from "@/libs/backend-client";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

// GET /api/credit-balance - 直接从后端系统获取详细的credit packs信息
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

    // 🎯 如果没有后端账户，返回前端缓存数据
    if (!backendAccountId) {
      console.log(`⚠️ No backend account for user ${user.email}, using frontend cache`);
      
      // 获取前端Transaction历史作为备用，排除技术性同步记录
      const transactions = await prisma.transaction.findMany({
        where: { 
          userId: user.id,
          type: {
            notIn: ["credit_sync_add", "credit_sync_deduct", "backend_sync"]
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      return NextResponse.json({
        source: "frontend_cache",
        backendConfigured: false,
        credits: {
          balance: user.profile.credits,
          totalEarned: user.profile.totalCreditsEarned,
          totalSpent: user.profile.totalCreditsSpent,
          dataSource: "frontend"
        },
        creditPacks: [],
        transactions: transactions.map(tx => ({
          id: tx.id,
          type: tx.amount > 0 ? 'earned' : 'spent',
          amount: tx.amount,
          description: tx.description,
          createdAt: tx.createdAt.toISOString(),
          gateway: tx.gateway,
          status: tx.status
        }))
      });
    }

    // 🚀 直接从后端系统获取最新的credit packs数据
    console.log(`🔍 Fetching real-time credit packs for backend account: ${backendAccountId}`);
    
    const creditPacksResult = await getBackendCreditPacks(backendAccountId);
    
    // 同时获取钱包信息以获取 point_remain 数据
    const { getBackendWallet } = require("@/libs/backend-client");
    const walletResult = await getBackendWallet(backendAccountId);
    
    if (!creditPacksResult.success || !walletResult.success) {
      console.error(`❌ Failed to fetch backend data: creditPacks=${creditPacksResult.error}, wallet=${walletResult?.error}`);
      
      // 后端失败时fallback到前端缓存，排除技术性同步记录
      const transactions = await prisma.transaction.findMany({
        where: { 
          userId: user.id,
          type: {
            notIn: ["credit_sync_add", "credit_sync_deduct", "backend_sync"]
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      return NextResponse.json({
        source: "frontend_fallback",
        backendConfigured: true,
        backendError: creditPacksResult.error || walletResult?.error,
        credits: {
          balance: user.profile.credits,
          totalEarned: user.profile.totalCreditsEarned,
          totalSpent: user.profile.totalCreditsSpent,
          dataSource: "frontend_fallback"
        },
        creditPacks: [],
        transactions: transactions.map(tx => ({
          id: tx.id,
          type: tx.amount > 0 ? 'earned' : 'spent',
          amount: tx.amount,
          description: tx.description,
          createdAt: tx.createdAt.toISOString(),
          gateway: tx.gateway,
          status: tx.status
        }))
      });
    }

    const backendData = creditPacksResult.data;
    const walletData = walletResult.wallet;
    
    // 使用新的余额计算公式: $账户总余额=(remainPoints + remainCredits)/1000
    const remainPoints = walletData.point_remain || 0;
    const remainCredits = backendData.available_credits || 0;
    const totalAccountBalance = (remainPoints + remainCredits) / 1000;
    
    // 获取前端Transaction历史用于交易记录显示，排除技术性同步记录
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId: user.id,
        type: {
          notIn: ["credit_sync_add", "credit_sync_deduct", "backend_sync"]
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`✅ Successfully fetched credit packs data for ${user.email}`);
    console.log(`🔍 Backend data: available=${backendData.available_credits}, total=${backendData.total_credits}, packs=${backendData.credit_packs_count}`);
    console.log(`🔍 Wallet data: remainPoints=${remainPoints}, remainCredits=${remainCredits}, totalBalance=$${totalAccountBalance}`);

    return NextResponse.json({
      source: "backend_realtime",
      backendConfigured: true,
      backendAccountId: backendAccountId,
      
      // 🎯 直接使用后端系统的真实数据（包含新的余额计算）
      credits: {
        balance: backendData.available_credits,
        totalCredits: backendData.total_credits,
        frozenCredits: backendData.frozen_credits,
        usedCredits: backendData.used_credits,
        expiredCredits: backendData.expired_credits,
        inactiveCredits: backendData.inactive_credits,
        dataSource: "backend",
        
        // 新的余额计算字段
        remainPoints: remainPoints,
        remainCredits: remainCredits, 
        totalAccountBalance: totalAccountBalance,
        balanceFormula: "(remainPoints + remainCredits) / 1000"
      },
      
      // 🎯 详细的credit packs信息
      creditPacks: backendData.credit_packs.map((pack: any) => ({
        id: pack.id,
        capacity: pack.capacity,
        used: pack.used,
        available: pack.capacity - pack.used,
        frozen: pack.frozen,
        active: pack.active,
        effectiveAt: pack.effective_at,
        expiredAt: pack.expired_at,
        description: pack.description,
        createdAt: pack.created_at,
        // 计算pack类型
        packType: pack.description?.includes('subscription') ? 'subscription' : 'topup',
        isExpired: new Date(pack.expired_at) < new Date(),
        daysUntilExpiry: Math.ceil((new Date(pack.expired_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      })),
      
      // 🎯 统计信息
      statistics: {
        totalPacks: backendData.credit_packs_count,
        activePacks: backendData.credit_packs.filter((p: any) => p.active).length,
        expiredPacks: backendData.credit_packs.filter((p: any) => new Date(p.expired_at) < new Date()).length,
        subscriptionPacks: backendData.credit_packs.filter((p: any) => p.description?.includes('subscription')).length,
        topupPacks: backendData.credit_packs.filter((p: any) => !p.description?.includes('subscription')).length
      },
      
      // 前端Transaction历史（用于显示交易记录）
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.amount > 0 ? 'earned' : 'spent',
        amount: tx.amount,
        description: tx.description,
        createdAt: tx.createdAt.toISOString(),
        gateway: tx.gateway,
        status: tx.status
      })),
      
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("💥 Error fetching credit balance:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}