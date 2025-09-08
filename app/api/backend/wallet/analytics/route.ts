import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { getBackendWallet } from "@/libs/backend-client";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

// GET /api/backend/wallet/analytics - 获取钱包使用分析
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
          setupRequired: true
        }
      });
    }

    // 获取钱包信息
    const walletResult = await getBackendWallet(backendAccountId);
    if (!walletResult.success) {
      return NextResponse.json(
        { error: "Failed to fetch wallet", details: walletResult.error },
        { status: 500 }
      );
    }

    // 获取前端交易历史
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const wallet = walletResult.wallet;
    const creditPacks = Array.isArray(wallet.credit_packs) ? wallet.credit_packs : [];
    const activePacks = creditPacks.filter((pack: any) => pack.active);

    // 计算使用趋势
    const creditTransactions = transactions.filter(t => 
      t.type === 'credit_purchase' || t.type === 'credit_spend'
    );
    
    const totalPurchased = creditTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = creditTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Credit Pack分析
    const packAnalysis = activePacks.map((pack: any) => {
      const usageRate = pack.capacity > 0 ? (pack.used / pack.capacity) * 100 : 0;
      const availableRate = pack.capacity > 0 ? ((pack.capacity - pack.used - pack.frozen) / pack.capacity) * 100 : 0;
      const daysUntilExpiry = Math.ceil((new Date(pack.expired_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: pack.id,
        description: pack.description,
        capacity: pack.capacity,
        used: pack.used,
        frozen: pack.frozen,
        available: pack.capacity - pack.used - pack.frozen,
        usageRate: parseFloat(usageRate.toFixed(2)),
        availableRate: parseFloat(availableRate.toFixed(2)),
        daysUntilExpiry,
        status: daysUntilExpiry <= 0 ? 'expired' : 
                daysUntilExpiry <= 7 ? 'expiring_soon' :
                daysUntilExpiry <= 30 ? 'expiring' : 'active',
        efficiency: usageRate > 80 ? 'high' : 
                   usageRate > 50 ? 'medium' : 'low'
      };
    });

    // 使用建议
    const recommendations = [];
    
    const totalAvailable = activePacks.reduce((sum: number, pack: any) => sum + (pack.capacity - pack.used - pack.frozen), 0);
    if (totalAvailable < 50) {
      recommendations.push({
        type: 'low_balance',
        priority: 'high',
        message: '您的可用credits较低，建议及时充值'
      });
    }
    
    const expiringSoon = packAnalysis.filter((pack: any) => pack.status === 'expiring_soon');
    if (expiringSoon.length > 0) {
      recommendations.push({
        type: 'expiring_credits',
        priority: 'medium',
        message: `您有 ${expiringSoon.length} 个credit pack即将过期，请及时使用`
      });
    }
    
    const lowEfficiencyPacks = packAnalysis.filter((pack: any) => pack.efficiency === 'low' && pack.daysUntilExpiry > 30);
    if (lowEfficiencyPacks.length > 0) {
      recommendations.push({
        type: 'low_usage',
        priority: 'low',
        message: '部分credit pack使用率较低，建议增加使用频率'
      });
    }

    return NextResponse.json({
      message: "Wallet analytics retrieved successfully",
      data: {
        // 概览数据
        overview: {
          totalCapacity: activePacks.reduce((sum: number, pack: any) => sum + pack.capacity, 0),
          totalUsed: activePacks.reduce((sum: number, pack: any) => sum + pack.used, 0),
          totalFrozen: activePacks.reduce((sum: number, pack: any) => sum + pack.frozen, 0),
          totalAvailable: totalAvailable,
          overallUsageRate: activePacks.reduce((sum: number, pack: any) => sum + pack.capacity, 0) > 0 ? 
            parseFloat(((activePacks.reduce((sum: number, pack: any) => sum + pack.used, 0) / activePacks.reduce((sum: number, pack: any) => sum + pack.capacity, 0)) * 100).toFixed(2)) : 0
        },
        
        // Credit Pack分析
        packAnalysis,
        
        // 使用趋势（最近30天）
        usageTrends: {
          period: "30 days",
          totalTransactions: creditTransactions.length,
          totalPurchased,
          totalSpent,
          netChange: totalPurchased - totalSpent,
          averageDaily: parseFloat((totalSpent / 30).toFixed(2))
        },
        
        // 状态分布
        statusDistribution: {
          active: packAnalysis.filter((p: any) => p.status === 'active').length,
          expiring: packAnalysis.filter((p: any) => p.status === 'expiring').length,
          expiring_soon: packAnalysis.filter((p: any) => p.status === 'expiring_soon').length,
          expired: packAnalysis.filter((p: any) => p.status === 'expired').length
        },
        
        // 效率分析
        efficiencyAnalysis: {
          high: packAnalysis.filter((p: any) => p.efficiency === 'high').length,
          medium: packAnalysis.filter((p: any) => p.efficiency === 'medium').length,
          low: packAnalysis.filter((p: any) => p.efficiency === 'low').length
        },
        
        // 建议
        recommendations,
        
        // 前端后端对比
        comparison: {
          frontend: user.profile.credits,
          backend: wallet.point_remain,
          difference: user.profile.credits - wallet.point_remain,
          syncRecommended: Math.abs(user.profile.credits - wallet.point_remain) > 10
        }
      }
    });

  } catch (error: any) {
    console.error("💥 Error fetching wallet analytics:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}