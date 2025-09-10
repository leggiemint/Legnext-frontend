// API Key 验证中间件 - 用于业务API调用
import { NextRequest } from "next/server";
import { prisma } from "@/libs/prisma";

export interface ApiKeyValidationResult {
  isValid: boolean;
  userId?: string;
  keyId?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
    profile: {
      plan: string;
      apiCalls: number;
      subscriptionStatus: string;
    };
  };
}

/**
 * 验证用户API密钥并返回用户信息
 * 这个函数验证用户在前端创建的API Key，然后返回用户信息供业务API使用
 */
export async function validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    if (!apiKey) {
      return { isValid: false, error: "API key is required" };
    }

    // 从UserApiKey表查找API密钥
    const userApiKey = await prisma.userApiKey.findFirst({
      where: {
        goApiKey: apiKey,
        isActive: true,
      },
      include: {
        user: {
          include: {
            profile: true,
          }
        }
      }
    });

    if (!userApiKey) {
      return { isValid: false, error: "Invalid or inactive API key" };
    }

    // 检查用户是否被删除
    if (userApiKey.user.isDelete) {
      return { isValid: false, error: "User account is disabled" };
    }

    // 注意：余额检查由后端API统一处理，这里不预先判断

    // 更新最后使用时间
    await prisma.userApiKey.update({
      where: { id: userApiKey.id },
      data: { lastUsedAt: new Date() }
    });


    return {
      isValid: true,
      userId: userApiKey.userId,
      keyId: userApiKey.id,
      user: {
        id: userApiKey.user.id,
        email: userApiKey.user.email,
        profile: {
          plan: userApiKey.user.profile.plan,
          apiCalls: userApiKey.user.profile.apiCalls,
          subscriptionStatus: userApiKey.user.profile.subscriptionStatus,
        }
      }
    };

  } catch (error) {
    console.error("💥 Error validating API key:", error);
    return { isValid: false, error: "Internal server error during API key validation" };
  }
}

/**
 * 获取用户用于后端系统调用的API Key
 * 实际上用户的API Key就是用于后端调用的
 */
export async function getUserBackendApiKey(userId: string): Promise<string | null> {
  try {
    // 查找用户最新的活跃API Key
    const userApiKey = await prisma.userApiKey.findFirst({
      where: {
        userId: userId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!userApiKey) {
      console.warn(`⚠️ No active API key found for user: ${userId}`);
      return null;
    }

    return userApiKey.goApiKey;
  } catch (error) {
    console.error("💥 Error getting backend API key:", error);
    return null;
  }
}

/**
 * 从请求头中提取API密钥
 */
export function extractApiKeyFromRequest(req: NextRequest): string | null {
  // 尝试从 Authorization 头获取
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // 支持 "Bearer api_key" 格式
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    // 直接返回任何API key格式
    return authHeader;
  }

  // 尝试从 X-API-Key 头获取
  const apiKeyHeader = req.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * 消费用户的API调用次数
 */
export async function consumeApiCall(userId: string, callsToConsume: number = 1): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      return false;
    }

    // 检查余额是否足够
    if (user.profile.apiCalls < callsToConsume) {
      return false;
    }

    // 扣减API调用次数
    await prisma.userProfile.update({
      where: { userId: userId },
      data: {
        apiCalls: user.profile.apiCalls - callsToConsume,
        totalApiCallsUsed: user.profile.totalApiCallsUsed + callsToConsume,
        // 同步更新旧的credits字段以保持兼容性
        credits: user.profile.apiCalls - callsToConsume,
        totalCreditsSpent: user.profile.totalCreditsSpent + callsToConsume,
      }
    });

    console.log(`✅ Consumed ${callsToConsume} API calls for user: ${user.email}, remaining: ${user.profile.apiCalls - callsToConsume}`);
    return true;

  } catch (error) {
    console.error("💥 Error consuming API call:", error);
    return false;
  }
}

/**
 * 获取API调用的费用（基于不同的操作类型）
 */
export function getApiCallCost(operation: string): number {
  // 根据操作类型返回不同的费用
  switch (operation) {
    case 'generate':
    case 'diffusion':
      return 80; // Diffusion文生图消耗80 credits
    case 'upscale':
      return 120; // Upscale消耗120 credits
    case 'variation':
      return 1;
    case 'describe':
      return 1;
    default:
      return 1;
  }
}

/**
 * 检查用户credits余额是否足够
 */
export async function checkCreditsBalance(userId: string, requiredCredits: number): Promise<{
  sufficient: boolean;
  currentBalance: number;
  error?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      return {
        sufficient: false,
        currentBalance: 0,
        error: "User not found"
      };
    }

    const currentBalance = user.profile.apiCalls || user.profile.credits || 0;
    
    return {
      sufficient: currentBalance >= requiredCredits,
      currentBalance: currentBalance
    };

  } catch (error) {
    console.error("💥 Error checking credits balance:", error);
    return {
      sufficient: false,
      currentBalance: 0,
      error: "Error checking balance"
    };
  }
}