import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { updateBackendAccountPlan, validateBackendConfig } from "@/libs/backend-client";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

// POST /api/debug/update-backend-plan - 直接更新后端账户计划（调试用）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      newPlan = "hobbyist",
      updateFrontend = true,
      reason = "Debug plan update"
    } = body;

    console.log(`🔄 [DEBUG-PLAN] Manual plan update for user: ${session.user.email}`);
    console.log(`🔄 [DEBUG-PLAN] Parameters:`, {
      newPlan,
      updateFrontend,
      reason,
      userId: session.user.id
    });

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      oldPlan: user.profile.plan,
      newPlan: newPlan,
      frontend: {
        processed: false,
        success: false,
        error: null
      },
      backend: {
        processed: false,
        success: false,
        error: null,
        accountId: null
      }
    };

    // 1. 更新前端计划（如果需要）
    if (updateFrontend) {
      console.log(`🔄 [DEBUG-PLAN] Updating frontend plan from ${user.profile.plan} to ${newPlan}...`);
      
      try {
        await prisma.userProfile.update({
          where: { userId: user.id },
          data: {
            plan: newPlan,
            subscriptionStatus: newPlan === 'free' ? 'canceled' : 'active',
            updatedAt: new Date()
          }
        });

        results.frontend.processed = true;
        results.frontend.success = true;
        console.log(`✅ [DEBUG-PLAN] Frontend plan updated to ${newPlan}`);
        
      } catch (error) {
        console.error(`❌ [DEBUG-PLAN] Frontend plan update failed:`, error);
        results.frontend.error = error.message || 'Unknown error';
      }
    } else {
      results.frontend.processed = true;
      results.frontend.success = true;
      console.log(`⏭️ [DEBUG-PLAN] Skipping frontend plan update`);
    }

    // 2. 更新后端计划
    console.log(`🔄 [DEBUG-PLAN] Processing backend plan update...`);
    
    try {
      // 检查后端配置
      const configCheck = validateBackendConfig();
      if (!configCheck.isValid) {
        throw new Error(`Backend configuration invalid: ${configCheck.error}`);
      }

      const backendAccountId = user.profile.preferences?.backendAccountId;
      
      if (!backendAccountId) {
        throw new Error('No backend account ID found in user preferences');
      }

      results.backend.accountId = backendAccountId;
      console.log(`🔄 [DEBUG-PLAN] Using backend account ID: ${backendAccountId}`);

      // 映射前端plan到后端plan
      let backendPlan: string;
      switch (newPlan) {
        case "free":
        case "hobbyist":
          backendPlan = "hobbyist";
          break;
        case "pro":
        case "developer":
          backendPlan = "developer";
          break;
        default:
          backendPlan = "hobbyist";
      }

      console.log(`🔄 [DEBUG-PLAN] Updating backend plan to: ${backendPlan}`);

      // 更新后端计划
      const planResult = await updateBackendAccountPlan({
        accountId: backendAccountId,
        newPlan: backendPlan
      });

      results.backend.processed = true;
      results.backend.success = planResult.success;
      results.backend.error = planResult.error || null;

      if (planResult.success) {
        console.log(`✅ [DEBUG-PLAN] Backend plan updated to ${backendPlan}`);
      } else {
        console.error(`❌ [DEBUG-PLAN] Backend plan update failed:`, planResult.error);
      }

      // 记录调试transaction
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "debug_plan_update",
          amount: 0,
          description: `Debug plan update: ${user.profile.plan} → ${newPlan}`,
          status: (results.frontend.success && results.backend.success) ? "completed" : "partial",
          gateway: "debug",
          gatewayTxnId: `debug-plan-${Date.now()}`,
          metadata: {
            debugTrigger: true,
            oldPlan: user.profile.plan,
            newPlan: newPlan,
            backendPlan: backendPlan,
            frontendSuccess: results.frontend.success,
            backendSuccess: results.backend.success,
            backendAccountId: backendAccountId,
            reason: reason,
            updatedAt: new Date()
          }
        }
      });

    } catch (error) {
      console.error(`❌ [DEBUG-PLAN] Backend processing error:`, error);
      results.backend.error = error.message || 'Unknown error';
    }

    const success = results.frontend.success && results.backend.success;

    console.log(`${success ? '✅' : '❌'} [DEBUG-PLAN] Manual plan update completed for ${user.email}`);
    
    return NextResponse.json({
      success,
      message: success ? "Plan update completed successfully" : "Plan update completed with errors",
      data: results
    });

  } catch (error: any) {
    console.error("💥 [DEBUG-PLAN] Error in manual plan update:", error);
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

// GET /api/debug/update-backend-plan - 获取可用的计划选项
export async function GET() {
  return NextResponse.json({
    message: "Backend plan update endpoint",
    method: "POST",
    parameters: {
      newPlan: {
        type: "string",
        default: "hobbyist",
        options: ["free", "hobbyist", "pro", "developer"],
        description: "Target plan to update to"
      },
      updateFrontend: {
        type: "boolean",
        default: true,
        description: "Whether to also update frontend user profile"
      },
      reason: {
        type: "string",
        default: "Debug plan update",
        description: "Reason for the plan update"
      }
    },
    planMapping: {
      "free → hobbyist": "Free plan maps to hobbyist backend plan",
      "hobbyist → hobbyist": "Hobbyist plan maps to hobbyist backend plan", 
      "pro → developer": "Pro plan maps to developer backend plan",
      "developer → developer": "Developer plan maps to developer backend plan"
    },
    example: {
      newPlan: "hobbyist",
      updateFrontend: true,
      reason: "Testing plan downgrade"
    }
  });
}