// 统一支付接口 - 支持Stripe和Square切换
// 通过环境变量 PAYMENT_GATEWAY=stripe|square 控制使用哪个网关

import { createCheckout as createStripeCheckout, createCustomerPortal as createStripePortal } from "@/libs/stripe";
import { createSquareCheckout } from "@/libs/square";

// 支付网关类型
type PaymentGateway = 'stripe' | 'square';

// 获取当前配置的支付网关 - 暂时硬编码使用Square
function getCurrentGateway(): PaymentGateway {
  // 暂时硬编码使用Square，避免环境变量配置问题
  return 'square';
  
  /* 原来的环境变量逻辑，暂时注释
  const gateway = (
    process.env.NEXT_PUBLIC_PAYMENT_GATEWAY || 
    process.env.PAYMENT_GATEWAY
  )?.toLowerCase() as PaymentGateway;
  return gateway === 'square' ? 'square' : 'stripe'; // 默认使用stripe
  */
}

// 创建结账会话的统一接口
export async function createCheckout(params: {
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
}): Promise<string | null> {
  const gateway = getCurrentGateway();
  
  switch (gateway) {
    case 'stripe':
      return createStripeCheckout(params);
      
    case 'square':
      return await createSquareCheckout(params);
      
    default:
      console.error(`Unknown payment gateway: ${gateway}`);
      return null;
  }
}

// 创建客户门户的统一接口
export async function createCustomerPortal(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string | null> {
  const gateway = getCurrentGateway();
  
  switch (gateway) {
    case 'stripe':
      return createStripePortal(params);
      
    case 'square':
      // Square portal功能已移除，用户可以通过subscription页面管理订阅
      console.log('Square portal not implemented, redirecting to subscription page');
      return `${process.env.NEXTAUTH_URL}/app/subscription`;
      
    default:
      console.error(`Unknown payment gateway: ${gateway}`);
      return null;
  }
}

// Square实现已移动到 libs/square.ts

// 获取当前网关类型（用于日志和调试）
export function getPaymentGatewayType(): PaymentGateway {
  return getCurrentGateway();
}

// 在应用启动时打印当前配置
if (typeof window === 'undefined') {
  const gateway = getCurrentGateway();
  console.log(`💳 Payment Gateway: ${gateway.toUpperCase()} (HARDCODED)`);
}