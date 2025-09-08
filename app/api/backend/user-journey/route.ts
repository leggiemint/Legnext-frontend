import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile, createUserBackendAccount } from "@/libs/user-service";
import { createBackendApiKey, generateApiKeyName } from "@/libs/backend-client";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

// POST /api/backend/user-journey - 完整用户体验流程初始化
// 流程：用户注册 → 获得100 credits → 体验图片生成 → 获取API Key → 使用API
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { step, createApiKey = false } = body;

    // 检查或创建后端账户
    let backendAccountId = user.profile.preferences?.backendAccountId;
    let backendSetupResult = null;
    
    if (!backendAccountId) {
      console.log(`🚀 Setting up backend account for new user: ${session.user.email}`);
      
      backendSetupResult = await createUserBackendAccount(
        session.user.id,
        session.user.email,
        user.profile.plan
      );

      if (backendSetupResult.success) {
        backendAccountId = backendSetupResult.backendAccountId;
      } else {
        // 如果后端未配置，仍然可以继续前端流程
        console.log(`⚠️ Backend setup failed: ${backendSetupResult.error}`);
      }
    }

    // 获取更新后的用户信息
    const updatedUser = await getUserWithProfile(session.user.id);
    
    // API Key创建逻辑
    let apiKeyResult = null;
    if (createApiKey && backendAccountId) {
      const apiKeyName = generateApiKeyName(session.user.email);
      
      apiKeyResult = await createBackendApiKey({
        accountId: backendAccountId,
        name: apiKeyName
      });
      
      if (apiKeyResult.success) {
        // 更新用户偏好，标记已创建API Key
        await prisma.userProfile.update({
          where: { userId: session.user.id },
          data: {
            preferences: {
              ...updatedUser!.profile.preferences,
              hasActiveApiKey: true,
              firstApiKeyCreatedAt: new Date().toISOString()
            }
          }
        });
      }
    }

    // 构建用户流程状态
    const journeyStatus = {
      // 步骤1: 用户注册 ✓ (已完成，因为能获取到用户信息)
      userRegistration: {
        completed: true,
        userId: user.id,
        email: session.user.email,
        name: user.name,
        registeredAt: new Date().toISOString() // 用户注册时间
      },
      
      // 步骤2: 获得100 credits ✓
      creditsReceived: {
        completed: true,
        currentCredits: updatedUser?.profile.credits || user.profile.credits,
        totalEarned: updatedUser?.profile.totalCreditsEarned || user.profile.totalCreditsEarned,
        welcomeBonus: 100
      },
      
      // 步骤3: 后端账户设置
      backendSetup: {
        completed: !!backendAccountId,
        backendAccountId,
        setupResult: backendSetupResult,
        canProceed: true // 即使后端未设置也可以继续前端体验
      },
      
      // 步骤4: 体验图片生成 (检查是否有生成记录)
      imageGeneration: {
        available: true,
        totalGenerated: updatedUser?.profile.imagesGenerated || user.profile.imagesGenerated,
        canGenerate: (updatedUser?.profile.credits || user.profile.credits) > 0
      },
      
      // 步骤5: API Key获取
      apiKeyAccess: {
        available: !!backendAccountId,
        hasApiKey: !!(updatedUser?.profile.preferences?.hasActiveApiKey),
        apiKey: apiKeyResult?.success ? {
          id: apiKeyResult.apiKey!.id,
          name: apiKeyResult.apiKey!.name,
          value: apiKeyResult.apiKey!.value,
          createdAt: apiKeyResult.apiKey!.created_at
        } : null,
        setupRequired: !backendAccountId
      }
    };

    // 确定下一步行动
    let nextSteps = [];
    
    if (!backendAccountId) {
      nextSteps.push({
        action: "setup_backend",
        title: "设置后端集成",
        description: "配置后端系统以获得完整API功能",
        endpoint: "/api/backend/setup"
      });
    }
    
    if ((updatedUser?.profile.credits || user.profile.credits) > 0 && (updatedUser?.profile.imagesGenerated || user.profile.imagesGenerated) === 0) {
      nextSteps.push({
        action: "generate_first_image",
        title: "生成第一张图片",
        description: "使用您的credits体验AI图片生成",
        endpoint: "/api/avatars"
      });
    }
    
    if (backendAccountId && !(updatedUser?.profile.preferences?.hasActiveApiKey)) {
      nextSteps.push({
        action: "create_api_key", 
        title: "获取API密钥",
        description: "创建API密钥以使用编程接口",
        endpoint: "/api/backend/api-keys"
      });
    }
    
    if ((updatedUser?.profile.preferences?.hasActiveApiKey)) {
      nextSteps.push({
        action: "use_api",
        title: "使用API接口",
        description: "通过API接口集成到您的应用程序",
        documentation: "/docs/api"
      });
    }

    return NextResponse.json({
      message: "User journey status retrieved successfully",
      data: {
        currentStep: step || "overview",
        journeyStatus,
        nextSteps,
        completionPercentage: calculateCompletionPercentage(journeyStatus),
        recommendations: generateRecommendations(journeyStatus)
      }
    });

  } catch (error: any) {
    console.error("💥 Error in user journey flow:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/backend/user-journey - 获取当前用户流程状态
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

    // 简单返回当前状态，不执行任何操作
    return NextResponse.json({
      data: {
        userId: user.id,
        email: session.user.email,
        currentCredits: user.profile.credits,
        totalGenerated: user.profile.imagesGenerated,
        hasBackendAccount: !!user.profile.preferences?.backendAccountId,
        hasApiKey: !!user.profile.preferences?.hasActiveApiKey,
        plan: user.profile.plan,
        subscriptionStatus: user.profile.subscriptionStatus
      }
    });

  } catch (error: any) {
    console.error("💥 Error getting user journey status:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// 辅助函数：计算完成百分比
function calculateCompletionPercentage(journeyStatus: any): number {
  const steps = [
    journeyStatus.userRegistration.completed,
    journeyStatus.creditsReceived.completed,
    journeyStatus.backendSetup.completed,
    journeyStatus.imageGeneration.totalGenerated > 0,
    journeyStatus.apiKeyAccess.hasApiKey
  ];
  
  const completedSteps = steps.filter(Boolean).length;
  return Math.round((completedSteps / steps.length) * 100);
}

// 辅助函数：生成个性化建议
function generateRecommendations(journeyStatus: any): string[] {
  const recommendations = [];
  
  if (journeyStatus.creditsReceived.currentCredits > 50) {
    recommendations.push("您有充足的credits，可以开始生成图片体验AI功能");
  }
  
  if (journeyStatus.imageGeneration.totalGenerated === 0) {
    recommendations.push("尝试生成您的第一张图片，体验AI图像生成的魅力");
  }
  
  if (!journeyStatus.backendSetup.completed) {
    recommendations.push("设置后端集成以获得API访问能力");
  }
  
  if (journeyStatus.backendSetup.completed && !journeyStatus.apiKeyAccess.hasApiKey) {
    recommendations.push("创建API密钥以便在您的应用中集成我们的服务");
  }
  
  if (journeyStatus.apiKeyAccess.hasApiKey) {
    recommendations.push("查看API文档，开始在您的项目中使用我们的服务");
  }
  
  return recommendations;
}