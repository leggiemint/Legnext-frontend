// API Key 验证中间件 - 支持前端和后端API Key系统
import { NextRequest } from "next/server";
import { prisma } from "@/libs/prisma";
import { getBackendApiKeys } from "@/libs/backend-client";
import { getUserWithProfile } from "@/libs/user-service";

export interface ApiKeyValidationResult {
  isValid: boolean;
  userId?: string;
  keyId?: string;
  error?: string;
  source?: 'frontend' | 'backend'; // 标识API密钥来源
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
 * 验证API密钥并返回用户信息 - 支持前端和后端API Key系统
 */
export async function validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    if (!apiKey) {
      return { isValid: false, error: "API key is required" };
    }

    // 验证API密钥格式 (支持前端lnx_格式和后端格式)
    if (!apiKey.startsWith('lnx_') && !apiKey.startsWith('go_')) {
      return { isValid: false, error: "Invalid API key format" };
    }

    // 优先尝试后端API Key验证
    if (apiKey.startsWith('go_')) {
      return await validateBackendApiKey(apiKey);
    }

    // 回退到前端API Key验证 (已废弃，但保持兼容性)
    return await validateFrontendApiKey(apiKey);

  } catch (error) {
    console.error("💥 Error validating API key:", error);
    return { isValid: false, error: "Internal server error during API key validation" };
  }
}

/**
 * 验证后端API密钥
 */
async function validateBackendApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    // 首先从前端数据库查找用户关联的后端账户
    const users = await prisma.user.findMany({
      include: { profile: true },
      where: {
        profile: {
          preferences: {
            path: ['backendAccountId'],
            not: null
          }
        },
        isDelete: false
      }
    });

    for (const user of users) {
      const backendAccountId = (user.profile?.preferences as any)?.backendAccountId;
      if (!backendAccountId) continue;

      try {
        // 获取后端API Keys
        const backendResult = await getBackendApiKeys(backendAccountId);
        if (!backendResult.success || !backendResult.apiKeys) continue;

        // 检查API Key是否匹配且未撤销
        const matchingKey = backendResult.apiKeys.find(
          key => key.value === apiKey && !key.revoked
        );

        if (matchingKey) {
          // 检查用户是否有足够的API调用余额
          if (user.profile.apiCalls <= 0) {
            return { 
              isValid: false, 
              error: "Insufficient API call balance. Please recharge your account.",
              userId: user.id,
              keyId: matchingKey.id.toString(),
              source: 'backend'
            };
          }

          console.log(`✅ Backend API key validated for user: ${user.email}`);

          return {
            isValid: true,
            userId: user.id,
            keyId: matchingKey.id.toString(),
            source: 'backend',
            user: {
              id: user.id,
              email: user.email,
              profile: {
                plan: user.profile.plan,
                apiCalls: user.profile.apiCalls,
                subscriptionStatus: user.profile.subscriptionStatus,
              }
            }
          };
        }
      } catch (backendError) {
        console.error(`❌ Error checking backend keys for user ${user.email}:`, backendError);
        continue;
      }
    }

    return { isValid: false, error: "Invalid or inactive backend API key" };
  } catch (error) {
    console.error("💥 Error validating backend API key:", error);
    return { isValid: false, error: "Error validating backend API key" };
  }
}

/**
 * 验证前端API密钥 (已废弃，但保持兼容性)
 */
async function validateFrontendApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    console.log(`⚠️ [DEPRECATED] Frontend API key validation used: ${apiKey.substring(0, 12)}...`);

    // 从前端数据库查找API密钥
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
      return { isValid: false, error: "Invalid or inactive frontend API key (deprecated)" };
    }

    // 检查用户是否被删除
    if (userApiKey.user.isDelete) {
      return { isValid: false, error: "User account is disabled" };
    }

    // 检查用户是否有足够的API调用余额
    if (userApiKey.user.profile.apiCalls <= 0) {
      return { 
        isValid: false, 
        error: "Insufficient API call balance. Please recharge your account.",
        userId: userApiKey.userId,
        keyId: userApiKey.id,
        source: 'frontend'
      };
    }

    // 更新最后使用时间
    await prisma.userApiKey.update({
      where: { id: userApiKey.id },
      data: { lastUsedAt: new Date() }
    });

    return {
      isValid: true,
      userId: userApiKey.userId,
      keyId: userApiKey.id,
      source: 'frontend',
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
    console.error("💥 Error validating frontend API key:", error);
    return { isValid: false, error: "Error validating frontend API key" };
  }
}

/**
 * 从请求头中提取API密钥
 */
export function extractApiKeyFromRequest(req: NextRequest): string | null {
  // 尝试从 Authorization 头获取
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // 支持 "Bearer lnx_..." 格式
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    // 支持 "lnx_..." 格式
    if (authHeader.startsWith('lnx_')) {
      return authHeader;
    }
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
export function getApiCallCost(operation: string, mode?: string): number {
  // 根据操作类型返回不同的费用
  switch (operation) {
    case 'generate':
      return mode === 'turbo' ? 1 : mode === 'fast' ? 2 : 3; // turbo=1, fast=2, mixed=3
    case 'upscale':
      return 1;
    case 'variation':
      return 1;
    case 'describe':
      return 1;
    default:
      return 1;
  }
}