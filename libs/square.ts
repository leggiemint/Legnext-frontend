// Square支付网关实现
// 使用真实的 Square SDK

import { Client, Environment } from 'squareup';
import { getPaymentConfig } from "@/config";
import crypto from 'crypto';

// 初始化 Square 客户端
const getSquareClient = () => {
  const client = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN!,
    environment: process.env.SQUARE_ENVIRONMENT === 'production' 
      ? Environment.Production 
      : Environment.Sandbox
  });
  return client;
};

interface SquareCheckoutParams {
  priceId: string;
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
  couponId?: string | null;
  clientReferenceId?: string;
  user?: {
    customerId?: string;
    email?: string;
  };
}

interface SquarePortalParams {
  customerId: string;
  returnUrl: string;
}

// 创建Square结账会话
export const createSquareCheckout = async (params: SquareCheckoutParams): Promise<string | null> => {
  try {
    console.log('🟦 Square checkout requested:', params);
    
    const { priceId, successUrl, user } = params;
    
    // 从Square配置中查找价格信息
    const squareConfig = getPaymentConfig();
    const plan = squareConfig.plans.find(p => p.priceId === priceId);
    
    if (!plan) {
      console.error(`Unknown Square price ID: ${priceId}`);
      console.log('Available Square price IDs:', squareConfig.plans.map(p => p.priceId));
      return null;
    }
    
    // 免费计划直接返回成功链接
    if (plan.isFree) {
      console.log('✅ Free plan detected, redirecting to success');
      return successUrl;
    }
    
    const priceInfo = {
      amount: plan.price * 100, // 转换为分 ($12.00 -> 1200)
      name: plan.name,
      credits: plan.credits
    };

    // 初始化 Square 客户端
    const client = getSquareClient();
    const { checkoutApi } = client;
    
    // 创建支付链接请求
    const createPaymentLinkRequest: any = {
      idempotencyKey: crypto.randomUUID(),
      description: `${plan.name} - ${plan.credits} credits`,
      quickPay: {
        name: plan.name,
        priceMoney: {
          amount: BigInt(priceInfo.amount),
          currency: 'USD'
        },
        locationId: process.env.SQUARE_LOCATION_ID!
      },
      checkoutOptions: {
        redirectUrl: successUrl,
        askForShippingAddress: false,
        merchantSupportEmail: process.env.SQUARE_SUPPORT_EMAIL || 'support@pngtubermaker.com'
      }
    };
    
    // 如果用户已登录，预填充邮箱
    if (user?.email) {
      createPaymentLinkRequest.prePopulatedData = {
        buyerEmail: user.email
      };
    }
    
    console.log('🔗 Creating Square payment link...', {
      amount: priceInfo.amount,
      plan: plan.name,
      locationId: process.env.SQUARE_LOCATION_ID
    });
    
    const response = await checkoutApi.createPaymentLink(createPaymentLinkRequest);
    
    if (response.result.paymentLink?.url) {
      console.log('✅ Square payment link created:', response.result.paymentLink.url);
      return response.result.paymentLink.url;
    } else {
      console.error('❌ Failed to create Square payment link:', response.result);
      return null;
    }
    
  } catch (error) {
    console.error('Square checkout creation failed:', error);
    return null;
  }
};

// 创建Square客户门户
export const createSquarePortal = async (params: SquarePortalParams): Promise<string | null> => {
  try {
    console.log('🟦 Square customer portal requested:', params);
    
    // Square没有像Stripe那样的直接客户门户
    // 返回自建的客户管理页面
    const { returnUrl } = params;
    
    // 构建自定义的客户管理页面URL
    const portalUrl = `${process.env.NEXTAUTH_URL}/app/billing?return_url=${encodeURIComponent(returnUrl)}`;
    
    console.log('🔗 Redirecting to custom Square portal:', portalUrl);
    return portalUrl;
    
  } catch (error) {
    console.error('Square customer portal creation failed:', error);
    return null;
  }
};

// Square订阅管理功能
export const createSquareSubscription = async (params: {
  customerId: string;
  planId: string;
  email?: string;
}): Promise<any> => {
  try {
    console.log('🟦 Creating Square subscription:', params);
    
    // TODO: 实现Square订阅创建
    // Square的订阅API相对复杂，需要先创建customer，再创建subscription
    // const client = getSquareClient();
    
    console.warn('⚠️ Square subscription creation not fully implemented');
    return null;
    
  } catch (error) {
    console.error('❌ Square subscription creation failed:', error);
    throw error;
  }
};

export const cancelSquareSubscription = async (subscriptionId: string): Promise<boolean> => {
  try {
    console.log('🟦 Canceling Square subscription:', subscriptionId);
    
    // TODO: 实现Square订阅取消
    // const client = getSquareClient();
    
    console.warn('⚠️ Square subscription cancellation not fully implemented');
    return false;
    
  } catch (error) {
    console.error('❌ Square subscription cancellation failed:', error);
    throw error;
  }
};

export const getSquareSubscription = async (subscriptionId: string): Promise<any> => {
  try {
    console.log('🟦 Getting Square subscription:', subscriptionId);
    
    // TODO: 实现Square订阅查询
    // const client = getSquareClient();
    
    console.warn('⚠️ Square subscription retrieval not fully implemented');
    return null;
    
  } catch (error) {
    console.error('❌ Square subscription retrieval failed:', error);
    throw error;
  }
};

// Square webhook验证
export const verifySquareWebhook = (payload: string, signature: string, secret: string): boolean => {
  try {
    // Square webhook 签名验证
    // Square使用基于HMAC-SHA256的签名验证
    const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL || '';
    const requestBody = payload;
    
    // 生成预期的签名
    const stringToSign = notificationUrl + requestBody;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(stringToSign, 'utf8')
      .digest('base64');
    
    // 比较签名
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
    
    if (!isValid) {
      console.error('❌ Square webhook signature verification failed');
      console.log('Expected:', expectedSignature);
      console.log('Received:', signature);
    }
    
    return isValid;
    
  } catch (error) {
    console.error('Square webhook verification failed:', error);
    return false;
  }
};