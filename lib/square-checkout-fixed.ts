import { SquareClient, SquareEnvironment } from "square";
import crypto from "crypto";
import { prisma } from "@/libs/prisma";
import { createOrGetSquareCustomer, createSquareSubscription } from "@/libs/square-subscriptions";

// 修复后的 Square 结账实现 - 使用真正的 Subscriptions API
export const createSquareCheckoutFixed = async (params: {
  priceId: string;
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
  clientReferenceId?: string;
  user?: {
    customerId?: string;
    email?: string;
  };
}): Promise<string | null> => {
  const startTime = Date.now();

  try {
    console.log('🟦 Fixed Square checkout requested:', {
      priceId: params.priceId,
      mode: params.mode,
      hasUser: !!params.user,
      userEmail: params.user?.email,
      timestamp: new Date().toISOString()
    });

    // 验证必需参数
    if (!params.priceId || !params.successUrl) {
      throw new Error('Price ID and success URL are required');
    }

    // 获取计划配置
    const plan = getPlanByPriceId(params.priceId);
    if (!plan) {
      throw new Error(`Invalid price ID: ${params.priceId}`);
    }

    // 免费计划直接返回成功链接
    if (plan.isFree) {
      console.log('✅ Free plan detected, redirecting to success URL');
      return params.successUrl;
    }

    // 对于订阅模式，使用真正的 Subscriptions API
    if (params.mode === "subscription") {
      if (!params.user?.email || !params.clientReferenceId) {
        throw new Error('Email and user ID are required for subscription checkout');
      }

      // 创建真正的 Square 订阅
      const subscription = await createSquareSubscription({
        customerId: params.user.customerId,
        planVariationId: params.priceId,
        userId: params.clientReferenceId || params.user.email
      });

      // 返回订阅管理页面而不是支付链接
      return `${params.successUrl}?subscription_id=${subscription.subscriptionId}&status=created`;
    }

    // 对于一次性支付，仍使用 Payment Links
    return await createPaymentLink(params, plan);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Fixed Square checkout creation failed:', {
      error: error.message,
      stack: error.stack,
      priceId: params.priceId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// 获取计划配置的辅助函数
function getPlanByPriceId(priceId: string) {
  const plans = [
    {
      priceId: "pro-monthly-subscription",
      name: "Pro",
      price: 30,
      credits: 30000,
      isFree: false
    },
    {
      priceId: "free",
      name: "Free", 
      price: 0,
      credits: 100,
      isFree: true
    }
  ];
  
  return plans.find(p => p.priceId === priceId);
}

// 创建 Payment Link 的辅助函数（用于一次性支付）
async function createPaymentLink(params: any, plan: any): Promise<string> {
  // 实现 Payment Link 创建逻辑
  // 这里保持原有的 Payment Link 实现
  throw new Error('Payment Links not implemented for one-time payments');
}
