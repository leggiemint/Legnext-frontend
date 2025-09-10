import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { getBackendAccount, validateBackendConfig } from "@/libs/backend-client";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

// GET /api/debug/user-status - 获取用户完整状态用于调试
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🔍 [DEBUG] Getting status for user: ${session.user.email}`);

    // 1. 获取用户基本信息
    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. 获取Customer信息（支付网关）
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id }
    });

    // 3. 获取最近的交易记录
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // 4. 获取最近的webhook事件
    const recentWebhooks = await prisma.webhookEvent.findMany({
      where: {
        OR: [
          { provider: 'stripe' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 5. 检查后端配置
    const backendConfig = validateBackendConfig();
    
    // 6. 获取后端账户信息（如果存在）
    let backendAccount = null;
    let backendError = null;
    
    const backendAccountId = user.profile.preferences?.backendAccountId;
    if (backendAccountId && backendConfig.isValid) {
      try {
        console.log(`🔍 [DEBUG] Fetching backend account: ${backendAccountId}`);
        const backendResult = await getBackendAccount(backendAccountId);
        backendAccount = backendResult.data;
      } catch (error) {
        console.error(`❌ [DEBUG] Failed to fetch backend account:`, error);
        backendError = error.message || 'Failed to fetch backend account';
      }
    }

    // 7. 获取当前订阅信息
    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    const debugInfo = {
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        // emailVerified: user.emailVerified, // Field not available in UserWithProfile
        // createdAt: user.createdAt // Field not available in UserWithProfile
      },
      profile: {
        plan: user.profile.plan,
        subscriptionStatus: user.profile.subscriptionStatus,
        credits: user.profile.credits,
        // apiCalls: user.profile.apiCalls, // Field not in UserWithProfile interface
        totalCreditsEarned: user.profile.totalCreditsEarned,
        totalCreditsSpent: user.profile.totalCreditsSpent,
        // totalApiCallsUsed: user.profile.totalApiCallsUsed, // Field not in UserWithProfile interface
        // totalApiCallsPurchased: user.profile.totalApiCallsPurchased, // Field not available
        imagesGenerated: user.profile.imagesGenerated,
        // lastActiveAt: user.profile.lastActiveAt, // Field not available
        preferences: user.profile.preferences,
        // createdAt: user.profile.createdAt, // Field not available
        // updatedAt: user.profile.updatedAt // Field not available
      },
      customer: customer ? {
        stripeCustomerId: customer.stripeCustomerId,
        paypalCustomerId: customer.paypalCustomerId,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      } : null,
      subscription: subscription ? {
        id: subscription.id,
        subscriptionId: subscription.subscriptionId,
        name: subscription.name,
        platform: subscription.platform,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        // currentPeriodStart: subscription.currentPeriodStart, // Field may not be available
        // currentPeriodEnd: subscription.currentPeriodEnd, // Field may not be available
        // nextInvoiceDate: subscription.nextInvoiceDate, // Field may not be available
        createdAt: subscription.createdAt,
        expiresAt: subscription.expiresAt
      } : null,
      backend: {
        configValid: backendConfig.isValid,
        configError: backendConfig.error,
        accountId: backendAccountId,
        account: backendAccount,
        error: backendError,
        availableCredits: backendAccount?.wallet ? 
          (backendAccount.wallet.credit_packs?.reduce((sum: number, pack: any) => 
            sum + Math.max(0, (pack.capacity || 0) - (pack.used || 0)), 0) || 0) : 0
      },
      recentTransactions: recentTransactions.map(txn => ({
        id: txn.id,
        type: txn.type,
        amount: txn.amount,
        description: txn.description,
        status: txn.status,
        gateway: txn.gateway,
        gatewayTxnId: txn.gatewayTxnId,
        subscriptionId: txn.subscriptionId,
        metadata: txn.metadata,
        createdAt: txn.createdAt
      })),
      recentWebhooks: recentWebhooks.map(webhook => ({
        id: webhook.id,
        provider: webhook.provider,
        eventId: webhook.eventId,
        eventType: webhook.eventType,
        processed: webhook.processed,
        processedAt: webhook.processedAt,
        error: webhook.error,
        createdAt: webhook.createdAt
      }))
    };

    console.log(`✅ [DEBUG] User status retrieved successfully for ${user.email}`);
    
    return NextResponse.json({
      success: true,
      data: debugInfo
    });

  } catch (error: any) {
    console.error("💥 [DEBUG] Error getting user status:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error", 
        details: error.message || "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}