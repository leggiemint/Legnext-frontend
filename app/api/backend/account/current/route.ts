import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { getBackendAccount } from "@/libs/backend-client";

export const dynamic = 'force-dynamic';

// GET /api/backend/account/current - 获取当前用户的后端账户详细信息
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
          userPlan: user.profile.plan,
          setupRequired: true
        }
      });
    }

    console.log(`🔍 Fetching current user's backend account: ${backendAccountId}`);

    // 从后端系统获取账户信息
    const backendAccount = await getBackendAccount(backendAccountId);

    if (backendAccount.code !== 200) {
      return NextResponse.json(
        { 
          error: "Failed to fetch backend account", 
          details: backendAccount.message,
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

    // 计算同步状态
    const frontendCredits = user.profile.credits;
    const backendCredits = backendAccount.data.wallet.point_remain;
    const creditsDifference = backendCredits - frontendCredits;
    const syncRequired = Math.abs(creditsDifference) > 0;

    return NextResponse.json({
      message: "Backend account details retrieved successfully",
      data: {
        hasBackendAccount: true,
        
        // 账户基本信息
        account: {
          id: backendAccount.data.id,
          name: backendAccount.data.name,
          isEnable: backendAccount.data.is_enable,
          accountGroup: backendAccount.data.account_group,
          plan: backendAccount.data.plan,
          type: backendAccount.data.type,
          createdAt: backendAccount.data.created_at,
          updatedAt: backendAccount.data.updated_at
        },
        
        // API密钥详细信息
        apiKeys: {
          count: backendAccount.data.api_keys ? backendAccount.data.api_keys.length : 0,
          activeCount: backendAccount.data.api_keys ? backendAccount.data.api_keys.filter(key => !key.revoked).length : 0,
          revokedCount: backendAccount.data.api_keys ? backendAccount.data.api_keys.filter(key => key.revoked).length : 0,
          hasActiveKeys: backendAccount.data.api_keys ? backendAccount.data.api_keys.some(key => !key.revoked) : false,
          
          // 主要的活跃Key（第一个未撤销的）
          primaryActiveKey: backendAccount.data.api_keys ? 
            backendAccount.data.api_keys.find(key => !key.revoked) ? {
              id: backendAccount.data.api_keys.find(key => !key.revoked)!.id,
              name: backendAccount.data.api_keys.find(key => !key.revoked)!.name,
              createdAt: backendAccount.data.api_keys.find(key => !key.revoked)!.created_at,
              preview: `${backendAccount.data.api_keys.find(key => !key.revoked)!.value.substring(0, 8)}...${backendAccount.data.api_keys.find(key => !key.revoked)!.value.substring(backendAccount.data.api_keys.find(key => !key.revoked)!.value.length - 8)}`
            } : null : null,
          
          // 所有API Keys的状态概览
          all: backendAccount.data.api_keys ? backendAccount.data.api_keys.map(key => ({
            id: key.id,
            name: key.name,
            revoked: key.revoked,
            createdAt: key.created_at,
            updatedAt: key.updated_at,
            preview: key.revoked ? "***REVOKED***" : `${key.value.substring(0, 8)}...${key.value.substring(key.value.length - 8)}`,
            status: key.revoked ? 'revoked' : 'active'
          })).sort((a, b) => {
            // 活跃的Key排在前面，然后按创建时间排序
            if (a.status !== b.status) {
              return a.status === 'active' ? -1 : 1;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }) : []
        },
        
        // Credits信息
        credits: {
          backend: backendCredits,
          frontend: frontendCredits,
          difference: creditsDifference,
          frozen: backendAccount.data.wallet.point_frozen,
          used: backendAccount.data.wallet.point_used,
          syncRequired
        },
        
        // 自动充值设置
        autoRecharge: {
          enabled: backendAccount.data.wallet.auto_recharge_enabled,
          threshold: backendAccount.data.wallet.auto_recharge_threshold_credit,
          target: backendAccount.data.wallet.auto_recharge_target_credit,
          lastTriggered: backendAccount.data.wallet.last_auto_recharge_triggered_at
        },
        
        // 任务容量状态
        taskCapacity: {
          maxConcurrent: backendAccount.data.max_concurrent_task_count,
          relax: {
            total: backendAccount.data.relax_task_capacity,
            used: backendAccount.data.relax_task_capacity_usage,
            remaining: backendAccount.data.relax_task_capacity - backendAccount.data.relax_task_capacity_usage
          },
          inputFailure: {
            total: backendAccount.data.input_failure_capacity,
            used: backendAccount.data.input_failure_capacity_usage,
            remaining: backendAccount.data.input_failure_capacity - backendAccount.data.input_failure_capacity_usage
          }
        },
        
        // 同步信息
        sync: {
          lastSyncedAt: user.profile.preferences?.backendSyncedAt,
          backendAccountName: user.profile.preferences?.backendAccountName,
          syncRequired
        }
      }
    });

  } catch (error: any) {
    console.error("💥 Error fetching current backend account:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}