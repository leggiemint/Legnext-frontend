import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    console.log(`🔍 Debugging Stripe webhook status for user: ${userId}`);

    // 1. 检查环境变量
    const envCheck = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: !!process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    };

    // 2. 检查用户配置
    let userProfile = null;
    let customer = null;
    if (userId) {
      userProfile = await prisma.userProfile.findUnique({
        where: { userId },
        include: { user: true }
      });
      
      // 获取customer信息（包含stripeCustomerId）
      customer = await prisma.customer.findUnique({
        where: { userId }
      });
    }

    // 3. 检查最近的webhook事件
    const recentWebhooks = await prisma.webhookEvent.findMany({
      where: {
        provider: "stripe",
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 最近24小时
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 4. 检查失败的webhook事件
    const failedWebhooks = await prisma.webhookEvent.findMany({
      where: {
        provider: "stripe",
        processed: false,
        metadata: {
          path: ['error'],
          not: null
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // 5. 尝试获取Stripe webhook配置
    let webhookEndpoints: any[] = [];
    try {
      const endpoints = await stripe.webhookEndpoints.list();
      webhookEndpoints = endpoints.data.map(endpoint => ({
        id: endpoint.id,
        url: endpoint.url,
        status: endpoint.status,
        events: endpoint.enabled_events
      }));
    } catch (error) {
      console.error("Failed to fetch webhook endpoints:", error);
    }

    // 6. 检查用户是否有Stripe客户ID
    let stripeCustomer = null;
    if (customer?.stripeCustomerId) {
      try {
        stripeCustomer = await stripe.customers.retrieve(customer.stripeCustomerId);
      } catch (error) {
        console.error("Failed to retrieve Stripe customer:", error);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        variables: envCheck,
        webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0
      },
      user: userProfile ? {
        id: userProfile.userId,
        email: userProfile.user.email,
        plan: userProfile.plan,
        subscriptionStatus: userProfile.subscriptionStatus,
        credits: userProfile.credits,
        stripeCustomerId: customer?.stripeCustomerId || null
      } : null,
      stripeCustomer: stripeCustomer ? {
        id: stripeCustomer.id,
        email: (stripeCustomer as any).email || null,
        created: (stripeCustomer as any).created || null,
        subscriptions: (stripeCustomer as any).subscriptions?.data || []
      } : null,
      webhooks: {
        recent: recentWebhooks.map(w => ({
          id: w.id,
          eventId: w.eventId,
          eventType: w.eventType,
          processed: w.processed,
          error: (w.metadata as any)?.error || null,
          createdAt: w.createdAt
        })),
        failed: failedWebhooks.map(w => ({
          id: w.id,
          eventId: w.eventId,
          eventType: w.eventType,
          error: (w.metadata as any)?.error || null,
          createdAt: w.createdAt
        }))
      },
      webhookEndpoints
    });

  } catch (error: any) {
    console.error("Stripe webhook debug error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 