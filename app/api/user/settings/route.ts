import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";
import { getBackendWallet, calculateAvailableCredits } from "@/libs/backend-client";

export const dynamic = 'force-dynamic';

// GET /api/user/settings - 获取用户设置和使用数据（标准架构）
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

    console.log(`✅ User data fetched successfully: ${user.email}`);
    console.log(`🔍 [DEBUG] Current frontend credits: ${user.profile.credits}`);

    // 🚀 获取后端系统的真实credits数据（单一数据源）
    let actualCredits = user.profile.credits; // 默认使用前端数据作为备用
    let backendCreditsAvailable = false;
    let syncPerformed = false;
    
    if (user.profile.preferences?.backendAccountId) {
      const backendAccountId = user.profile.preferences.backendAccountId;
      console.log(`🔍 [DEBUG] Checking backend account: ${backendAccountId}`);
      
      try {
        // 🎯 使用专门的钱包API获取完整的credit_packs数据
        const walletResult = await getBackendWallet(backendAccountId);
        console.log(`🔍 [DEBUG] Wallet API success: ${walletResult.success}`);
        
        if (walletResult.success && walletResult.wallet) {
          console.log(`🔍 [DEBUG] Full wallet response:`, JSON.stringify(walletResult.wallet, null, 2));
          
          // 🎯 正确计算credits：从credit_packs计算可用余额
          actualCredits = calculateAvailableCredits(walletResult.wallet);
          backendCreditsAvailable = true;
          
          const creditPacks = walletResult.wallet.credit_packs || [];
          console.log(`🔍 [DEBUG] Wallet API point_remain: ${walletResult.wallet.point_remain}`);
          console.log(`🔍 [DEBUG] Credit packs found: ${creditPacks.length}`);
          if (Array.isArray(creditPacks)) {
            creditPacks.forEach((pack: any, index: number) => {
              console.log(`🔍 [DEBUG] Pack ${index + 1}: capacity=${pack.capacity}, used=${pack.used}, available=${pack.capacity - pack.used}, active=${pack.active}`);
            });
          }
          console.log(`🔍 [DEBUG] Calculated total credits: ${actualCredits}`);
          
          // 🔄 懒加载同步：如果后端数据与前端不一致，自动同步前端数据库
          if (actualCredits !== user.profile.credits) {
            const creditsDiff = actualCredits - user.profile.credits;
            console.log(`🔍 [DEBUG] Credits mismatch detected!`);
            console.log(`🔍 [DEBUG] Frontend: ${user.profile.credits}, Backend: ${actualCredits}, Diff: ${creditsDiff > 0 ? '+' : ''}${creditsDiff}`);
            console.log(`🔄 [SYNC] Starting lazy sync for ${user.email}: ${user.profile.credits} → ${actualCredits}`);
            
            // 更新前端数据库并记录同步日志
            await prisma.$transaction(async (tx) => {
              await tx.userProfile.update({
                where: { userId: user.id },
                data: { 
                  credits: actualCredits,
                  apiCalls: actualCredits, // 保持兼容
                  // 根据变化更新统计数据
                  ...(creditsDiff < 0 && {
                    totalCreditsSpent: user.profile.totalCreditsSpent + Math.abs(creditsDiff),
                    totalApiCallsUsed: user.profile.totalApiCallsUsed + Math.abs(creditsDiff)
                  }),
                  ...(creditsDiff > 0 && {
                    totalCreditsEarned: user.profile.totalCreditsEarned + creditsDiff,
                    totalApiCallsPurchased: user.profile.totalApiCallsPurchased + creditsDiff
                  }),
                  preferences: {
                    ...user.profile.preferences,
                    backendSyncedAt: new Date().toISOString()
                  }
                }
              });

              // 记录同步交易日志
              await tx.transaction.create({
                data: {
                  userId: user.id,
                  type: creditsDiff > 0 ? "credit_sync_add" : "credit_sync_deduct",
                  amount: creditsDiff,
                  description: `Lazy sync from backend: ${user.profile.credits} → ${actualCredits}`,
                  status: "completed",
                  metadata: {
                    syncType: "lazy_sync",
                    backendAccountId: user.profile.preferences.backendAccountId,
                    previousCredits: user.profile.credits,
                    newCredits: actualCredits,
                    trigger: "user_settings_access"
                  }
                }
              });
            });
            
            syncPerformed = true;
            console.log(`✅ [SYNC] Lazy sync completed successfully for ${user.email}`);
            console.log(`🔍 [DEBUG] Transaction record created with type: ${creditsDiff > 0 ? 'credit_sync_add' : 'credit_sync_deduct'}`);
          } else {
            console.log(`🔍 [DEBUG] Credits already in sync - no update needed`);
          }
        } else {
          console.log(`❌ [ERROR] Wallet API failed: ${walletResult.error}`);
        }
      } catch (error) {
        console.error(`❌ [ERROR] Failed to fetch backend credits for ${user.email}:`, error?.message);
        console.log(`🔍 [DEBUG] Error details:`, error);
      }
    } else {
      console.log(`🔍 [DEBUG] No backend account configured for user: ${user.email}`);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        plan: user.profile.plan,
        subscriptionStatus: user.profile.subscriptionStatus,
        totalAvatarsCreated: user.profile.imagesGenerated,
        preferences: user.profile.preferences,
      },
      credits: {
        balance: actualCredits, // 🎯 使用后端真实数据
        totalEarned: user.profile.totalCreditsEarned,
        totalSpent: user.profile.totalCreditsSpent,
        lastCreditGrant: {
          date: new Date().toISOString(),
          amount: 60,
          reason: "Welcome bonus credits"
        },
        // 添加数据源标识和同步状态
        dataSource: backendCreditsAvailable ? 'backend' : 'frontend',
        syncStatus: {
          lastSyncedAt: user.profile.preferences?.backendSyncedAt || null,
          syncPerformed: syncPerformed,
          backendAvailable: backendCreditsAvailable
        }
      },
      // 🔍 [DEBUG] 在响应中添加调试信息
      debug: {
        frontendCredits: user.profile.credits,
        backendCredits: backendCreditsAvailable ? actualCredits : null,
        creditsDifference: backendCreditsAvailable ? actualCredits - user.profile.credits : null,
        backendAccountId: user.profile.preferences?.backendAccountId || null,
        syncTriggered: syncPerformed
      },
      planLimits: {
        creditsPerMonth: (user.profile.plan === "pro" || user.profile.plan === "premium") ? 30000 : 0,
        animationsAllowed: (user.profile.plan === "pro" || user.profile.plan === "premium"),
        hdExportsAllowed: (user.profile.plan === "pro" || user.profile.plan === "premium"),
        watermarkFree: (user.profile.plan === "pro" || user.profile.plan === "premium"),
        commercialUse: (user.profile.plan === "pro" || user.profile.plan === "premium"),
      },
      subscription: {
        isActive: user.profile.subscriptionStatus === "active",
        plan: user.profile.plan,
        endDate: null, // 从profile中获取如果需要
      },
    });
  } catch (error) {
    console.error("💥 Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/user/settings - 更新用户偏好设置
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { preferences } = body;

    // 验证偏好设置结构
    if (preferences) {
      const validStyles = ["anime", "realistic", "cartoon", "chibi"];
      const validFormats = ["png", "jpg", "webp"];

      if (preferences.defaultStyle && !validStyles.includes(preferences.defaultStyle)) {
        return NextResponse.json(
          { error: "Invalid default style" },
          { status: 400 }
        );
      }

      if (preferences.defaultFormat && !validFormats.includes(preferences.defaultFormat)) {
        return NextResponse.json(
          { error: "Invalid default format" },
          { status: 400 }
        );
      }
    }

    // 更新偏好设置
    if (preferences) {
      await prisma.userProfile.update({
        where: { userId: user.id },
        data: {
          preferences: {
            ...user.profile.preferences,
            ...preferences,
          }
        }
      });
    }

    // 返回更新后的用户信息
    const updatedUser = await getUserWithProfile(user.id);

    return NextResponse.json({
      message: "Settings updated successfully",
      data: {
        user: {
          id: updatedUser!.id,
          name: updatedUser!.name,
          email: updatedUser!.email,
          image: updatedUser!.image,
          plan: updatedUser!.profile.plan,
          subscriptionStatus: updatedUser!.profile.subscriptionStatus,
          preferences: updatedUser!.profile.preferences,

        },
      },
    });
  } catch (error) {
    console.error("💥 Error updating user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
