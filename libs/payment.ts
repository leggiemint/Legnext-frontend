// Stripe payment gateway - Simplified interface

import { createCheckout as createStripeCheckout, createCustomerPortal as createStripePortal } from "@/libs/stripe";

// 创建结账会话 - 直接使用Stripe
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
  return createStripeCheckout(params);
}

// 创建客户门户 - 直接使用Stripe
export async function createCustomerPortal(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string | null> {
  return createStripePortal(params);
}

// 获取当前网关类型（固定为Stripe）
export function getPaymentGatewayType(): 'stripe' {
  return 'stripe';
}

// 在应用启动时打印当前配置
if (typeof window === 'undefined') {
  console.log(`💳 Payment Gateway: STRIPE`);
}