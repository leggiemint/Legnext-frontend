import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { getBackendAccount } from "@/libs/backend-client";

export const dynamic = 'force-dynamic';

// GET /api/backend/account/[id] - 通过ID获取后端账户详细信息
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = parseInt(params.id);
    
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "Invalid account ID" },
        { status: 400 }
      );
    }

    // 获取用户信息，确保只能查询自己的账户
    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userBackendAccountId = user.profile.preferences?.backendAccountId;
    
    // 安全检查：只允许查询自己的后端账户
    if (userBackendAccountId !== accountId) {
      return NextResponse.json(
        { error: "Access denied. You can only view your own account." },
        { status: 403 }
      );
    }

    console.log(`🔍 Fetching backend account details for ID: ${accountId}`);

    // 从后端系统获取账户信息
    const backendAccount = await getBackendAccount(accountId);

    if (backendAccount.code !== 200) {
      return NextResponse.json(
        { error: "Failed to fetch backend account", details: backendAccount.message },
        { status: 500 }
      );
    }

    // 返回详细的账户信息
    return NextResponse.json({
      message: "Backend account retrieved successfully",
      data: {
        // 账户基本信息
        account: {
          id: backendAccount.data.id,
          name: backendAccount.data.name,
          isEnable: backendAccount.data.is_enable,
          accountGroup: backendAccount.data.account_group,
          plan: backendAccount.data.plan,
          type: backendAccount.data.type,
          createdAt: backendAccount.data.created_at,
          updatedAt: backendAccount.data.updated_at,
          notificationHookUrl: backendAccount.data.notification_hook_url
        },
        
        // API密钥信息
        apiKeys: backendAccount.data.api_keys.map(key => ({
          id: key.id,
          name: key.name,
          revoked: key.revoked,
          createdAt: key.created_at,
          // 安全考虑：只显示部分API密钥
          value: key.value ? `${key.value.substring(0, 8)}...${key.value.substring(-8)}` : null
        })),
        
        // 钱包信息
        wallet: {
          id: backendAccount.data.wallet.id,
          accountId: backendAccount.data.wallet.account_id,
          pointRemain: backendAccount.data.wallet.point_remain,
          pointFrozen: backendAccount.data.wallet.point_frozen,
          pointUsed: backendAccount.data.wallet.point_used,
          autoRechargeEnabled: backendAccount.data.wallet.auto_recharge_enabled,
          autoRechargeThreshold: backendAccount.data.wallet.auto_recharge_threshold_credit,
          autoRechargeTarget: backendAccount.data.wallet.auto_recharge_target_credit,
          lastAutoRechargeAt: backendAccount.data.wallet.last_auto_recharge_triggered_at,
          createdAt: backendAccount.data.wallet.created_at,
          updatedAt: backendAccount.data.wallet.updated_at
        },
        
        // 任务容量信息
        taskCapacity: {
          maxConcurrentTasks: backendAccount.data.max_concurrent_task_count,
          relaxTaskCapacity: backendAccount.data.relax_task_capacity,
          relaxTaskCapacityUsage: backendAccount.data.relax_task_capacity_usage,
          inputFailureCapacity: backendAccount.data.input_failure_capacity,
          inputFailureCapacityUsage: backendAccount.data.input_failure_capacity_usage
        },
        
        // 账户标签
        accountTags: backendAccount.data.account_tags || [],
        
        // 前端同步信息
        frontendSync: {
          frontendUserId: user.id,
          frontendCredits: user.profile.credits,
          syncedAt: user.profile.preferences?.backendSyncedAt,
          creditsDifference: backendAccount.data.wallet.point_remain - user.profile.credits
        }
      }
    });

  } catch (error: any) {
    console.error("💥 Error fetching backend account details:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}