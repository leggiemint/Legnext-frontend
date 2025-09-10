import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile, updateSubscription } from "@/libs/user-service";
import { updateBackendAccountPlan, validateBackendConfig } from "@/libs/backend-client";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

// POST /api/debug/trigger-cancellation - 手动触发订阅取消处理（调试用）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      skipFrontend = false,
      skipBackend = false,
      reason = "Debug cancellation test"
    } = body;

    console.log(`🚫 [DEBUG-CANCEL] Manual cancellation trigger for user: ${session.user.email}`);
    console.log(`🚫 [DEBUG-CANCEL] Parameters:`, {
      skipFrontend,
      skipBackend,
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
      frontend: {
        processed: false,
        subscription: null,
        profileUpdate: null,
        error: null
      },
      backend: {
        processed: false,
        plan: null,
        error: null
      }
    };

    // 1. 前端处理
    if (!skipFrontend) {
      console.log(`🔄 [DEBUG-CANCEL] Processing frontend cancellation...`);
      
      try {
        // 取消订阅状态 - 调试模式不创建Customer记录
        const subscriptionResult = await updateSubscription(
          user.id,
          "free",
          "canceled",
          null, // 不创建Customer记录，避免污染生产数据
          undefined,
          undefined,
          undefined
        );

        results.frontend.subscription = subscriptionResult;

        if (subscriptionResult.success) {
          console.log(`✅ [DEBUG-CANCEL] Frontend subscription canceled`);
          
          // 更新用户profile
          await prisma.userProfile.update({
            where: { userId: user.id },
            data: {
              plan: 'free',
              subscriptionStatus: 'canceled'
            }
          });

          results.frontend.profileUpdate = { success: true };
          console.log(`✅ [DEBUG-CANCEL] Frontend profile updated to free plan`);
        } else {
          console.error(`❌ [DEBUG-CANCEL] Frontend subscription cancellation failed:`, subscriptionResult.error);
        }
        
        results.frontend.processed = true;
        
      } catch (error) {
        console.error(`❌ [DEBUG-CANCEL] Frontend processing error:`, error);
        results.frontend.error = error.message || 'Unknown error';
      }
    }

    // 2. 后端处理
    if (!skipBackend) {
      console.log(`🔄 [DEBUG-CANCEL] Processing backend cancellation...`);
      
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

        console.log(`🔄 [DEBUG-CANCEL] Using backend account ID: ${backendAccountId}`);

        // 降级后端计划到 hobbyist
        const planResult = await updateBackendAccountPlan({
          accountId: backendAccountId,
          newPlan: "hobbyist"
        });

        results.backend.plan = planResult;

        if (planResult.success) {
          console.log(`✅ [DEBUG-CANCEL] Backend plan downgraded to hobbyist`);
        } else {
          console.error(`❌ [DEBUG-CANCEL] Backend plan downgrade failed:`, planResult.error);
        }

        results.backend.processed = true;

        // 记录调试transaction
        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: "debug_cancellation",
            amount: 0,
            description: "Debug manual cancellation trigger",
            status: planResult.success ? "completed" : "partial",
            gateway: "debug",
            gatewayTxnId: `debug-cancel-${Date.now()}`,
            metadata: {
              debugTrigger: true,
              planResult: planResult.success,
              backendAccountId: backendAccountId,
              cancelReason: reason,
              canceledAt: new Date()
            }
          }
        });

      } catch (error) {
        console.error(`❌ [DEBUG-CANCEL] Backend processing error:`, error);
        results.backend.error = error.message || 'Unknown error';
      }
    }

    const success = (!skipFrontend ? results.frontend.processed && !results.frontend.error : true) &&
                   (!skipBackend ? results.backend.processed && !results.backend.error : true);

    console.log(`${success ? '✅' : '❌'} [DEBUG-CANCEL] Manual cancellation trigger completed for ${user.email}`);
    
    return NextResponse.json({
      success,
      message: success ? "Manual cancellation trigger completed successfully" : "Manual cancellation trigger completed with errors",
      data: results
    });

  } catch (error: any) {
    console.error("💥 [DEBUG-CANCEL] Error in manual cancellation trigger:", error);
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

// GET /api/debug/trigger-cancellation - 获取取消参数说明
export async function GET() {
  return NextResponse.json({
    message: "Manual cancellation trigger endpoint",
    method: "POST",
    parameters: {
      skipFrontend: {
        type: "boolean",
        default: false,
        description: "Skip frontend cancellation processing"
      },
      skipBackend: {
        type: "boolean",
        default: false, 
        description: "Skip backend cancellation processing"
      },
      reason: {
        type: "string",
        default: "Debug cancellation test",
        description: "Cancellation reason"
      }
    },
    example: {
      skipFrontend: false,
      skipBackend: false,
      reason: "Testing cancellation flow"
    }
  });
}