import { NextResponse } from "next/server";
import configFile from "@/config";

// Temporary debug endpoint to check Stripe configuration
export async function GET() {
  return NextResponse.json({
    plans: configFile.stripe.plans,
    environment: process.env.NODE_ENV,
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripeSecretPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 12) + "...",
    // 🔍 添加环境变量调试信息
    environmentVariables: {
      STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
      hasStripePriceId: !!process.env.STRIPE_PRO_PRICE_ID,
      NODE_ENV: process.env.NODE_ENV,
    },
    // 🔍 显示实际配置的priceId
    actualPriceId: configFile.stripe.plans.find(p => p.name === "Pro")?.priceId,
  });
}