import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile, updateSubscription, grantCredits } from "@/libs/user-service";
import { updateBackendAccountPlan, createBackendCreditPack, validateBackendConfig } from "@/libs/backend-client";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

// POST /api/debug/trigger-subscription - 手动触发订阅处理（调试用）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      plan = "pro", 
      credits = 200, 
      backendCredits = 33000,
      skipFrontend = false,
      skipBackend = false 
    } = body;

    console.log(`🔄 [DEBUG-TRIGGER] Manual subscription trigger for user: ${session.user.email}`);
    console.log(`🔄 [DEBUG-TRIGGER] Parameters:`, {
      plan, 
      credits, 
      backendCredits,
      skipFrontend,
      skipBackend,
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
      frontend: {
        processed: false,
        subscription: null as any,
        credits: null as any,
        error: null as string | null
      },
      backend: {
        processed: false,
        plan: null as string | null,
        creditPack: null as any,
        error: null as string | null
      }
    };

    // 1. 前端处理
    if (!skipFrontend) {
      console.log(`🔄 [DEBUG-TRIGGER] Processing frontend subscription...`);
      
      try {
        // 更新订阅状态 - 调试模式不创建Customer记录
        const subscriptionResult = await updateSubscription(
          user.id,
          plan,
          "active",
          null, // 不创建Customer记录，避免污染生产数据
          null, // 不设置price ID
          new Date(),
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后
        );

        results.frontend.subscription = subscriptionResult;

        if (subscriptionResult.success) {
          console.log(`✅ [DEBUG-TRIGGER] Frontend subscription updated`);
          
          // 授予credits
          const creditResult = await grantCredits(
            user.id,
            credits,
            "Debug subscription credits",
            "debug",
            "debug-transaction-id"
          );

          results.frontend.credits = creditResult;
          
          if (creditResult.success) {
            console.log(`✅ [DEBUG-TRIGGER] Frontend credits granted: ${credits}`);
          } else {
            console.error(`❌ [DEBUG-TRIGGER] Frontend credits failed:`, creditResult.error);
          }
        } else {
          console.error(`❌ [DEBUG-TRIGGER] Frontend subscription failed:`, subscriptionResult.error);
        }
        
        results.frontend.processed = true;
        
      } catch (error) {
        console.error(`❌ [DEBUG-TRIGGER] Frontend processing error:`, error);
        results.frontend.error = error.message || 'Unknown error';
      }
    }

    // 2. 后端处理
    if (!skipBackend) {
      console.log(`🔄 [DEBUG-TRIGGER] Processing backend sync...`);
      
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

        console.log(`🔄 [DEBUG-TRIGGER] Using backend account ID: ${backendAccountId}`);

        // 更新后端计划
        const planResult = await updateBackendAccountPlan({
          accountId: backendAccountId,
          newPlan: "developer"
        });

        results.backend.plan = planResult.success ? "developer" : "upgrade_failed";

        if (planResult.success) {
          console.log(`✅ [DEBUG-TRIGGER] Backend plan updated to developer`);
        } else {
          console.error(`❌ [DEBUG-TRIGGER] Backend plan update failed:`, planResult.error);
        }

        // 创建后端credit pack
        const creditPackResult = await createBackendCreditPack({
          accountId: backendAccountId,
          capacity: backendCredits,
          description: "Debug subscription credits pack - 31 days",
          type: "subscription"
        });

        results.backend.creditPack = creditPackResult;

        if (creditPackResult.success) {
          console.log(`✅ [DEBUG-TRIGGER] Backend credit pack created: ${backendCredits}`);
        } else {
          console.error(`❌ [DEBUG-TRIGGER] Backend credit pack failed:`, creditPackResult.error);
        }

        results.backend.processed = true;

        // 记录调试transaction
        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: "debug_subscription",
            amount: 0,
            description: "Debug manual subscription trigger",
            status: (planResult.success && creditPackResult.success) ? "completed" : "partial",
            gateway: "debug",
            gatewayTxnId: `debug-${Date.now()}`,
            metadata: {
              debugTrigger: true,
              planResult: planResult.success,
              creditPackResult: creditPackResult.success,
              backendAccountId: backendAccountId,
              frontendCredits: credits,
              backendCredits: backendCredits
            }
          }
        });

      } catch (error) {
        console.error(`❌ [DEBUG-TRIGGER] Backend processing error:`, error);
        results.backend.error = error.message || 'Unknown error';
      }
    }

    const success = (!skipFrontend ? results.frontend.processed && !results.frontend.error : true) &&
                   (!skipBackend ? results.backend.processed && !results.backend.error : true);

    console.log(`${success ? '✅' : '❌'} [DEBUG-TRIGGER] Manual trigger completed for ${user.email}`);
    
    return NextResponse.json({
      success,
      message: success ? "Manual subscription trigger completed successfully" : "Manual subscription trigger completed with errors",
      data: results
    });

  } catch (error: any) {
    console.error("💥 [DEBUG-TRIGGER] Error in manual subscription trigger:", error);
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

// GET /api/debug/trigger-subscription - 获取触发参数说明
export async function GET() {
  return NextResponse.json({
    message: "Manual subscription trigger endpoint",
    method: "POST",
    parameters: {
      plan: {
        type: "string",
        default: "pro",
        description: "Subscription plan to set"
      },
      credits: {
        type: "number", 
        default: 200,
        description: "Frontend credits to grant"
      },
      backendCredits: {
        type: "number",
        default: 33000, 
        description: "Backend credits to grant"
      },
      skipFrontend: {
        type: "boolean",
        default: false,
        description: "Skip frontend processing"
      },
      skipBackend: {
        type: "boolean", 
        default: false,
        description: "Skip backend processing"
      }
    },
    example: {
      plan: "pro",
      credits: 200,
      backendCredits: 33000,
      skipFrontend: false,
      skipBackend: false
    }
  });
}