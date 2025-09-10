import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { updateSubscription, getUserWithProfile, grantCredits } from "@/libs/user-service";
import { verifySquareWebhook } from "@/libs/square";

// 统一的 Square webhook 处理器
const RELEVANT_EVENTS = new Set([
  // 支付事件
  'payment.completed',
  'payment.created', 
  'payment.updated',
  'payment.failed',
  
  // 订阅事件
  'subscription.created',
  'subscription.updated',
  'subscription.paused',
  'subscription.resumed',
  'subscription.canceled',
  
  // 发票事件
  'invoice.published',
  'invoice.payment_made',
  'invoice.payment_failed',
  'invoice.canceled',
  'invoice.completed'
]);

export async function POST(req: NextRequest) {
  let eventType: string | null = null;
  let event: any = null;
  let eventId: string | null = null;

  try {
    console.log("🔔 Unified Square webhook received - starting processing...");
    
    const body = await req.text();
    const signature = req.headers.get("x-square-hmacsha256-signature");
    const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;

    if (!signature) {
      console.error("❌ Missing Square webhook signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!webhookSecret) {
      console.error("❌ SQUARE_WEBHOOK_SECRET environment variable not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 验证 webhook 签名
    if (!verifySquareWebhook(body, signature, webhookSecret)) {
      console.error("❌ Invalid Square webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 解析事件数据
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error("❌ Failed to parse webhook body:", parseError);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    eventType = event.type;
    eventId = event.event_id;

    console.log(`🔔 Processing Square webhook: ${eventType}`, {
      eventId: eventId,
      merchantId: event.merchant_id,
      createdAt: event.created_at
    });

    // 检查是否已处理过此事件
    const existingEvent = await prisma.webhookEvent.findFirst({
      where: {
        provider: "square",
        eventId: eventId
      }
    });

    if (existingEvent) {
      console.log(`⏭️ Event ${eventId} already processed`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 记录 webhook 事件
    await prisma.webhookEvent.create({
      data: {
        provider: "square",
        eventId: eventId,
        eventType: eventType,
        processed: false,
        metadata: event
      }
    });

    // 处理不同类型的事件
    if (!RELEVANT_EVENTS.has(eventType)) {
      console.log(`ℹ️ Unhandled event type: ${eventType}`);
      return NextResponse.json({ received: true });
    }

    await processWebhookEvent(eventType, event);

    // 标记为已处理
    await prisma.webhookEvent.updateMany({
      where: {
        provider: "square",
        eventId: eventId
      },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });

    console.log(`✅ Square webhook processed successfully: ${eventType}`);
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("❌ Square webhook processing error:", error);
    
    // 标记为处理失败
    if (eventId) {
      await prisma.webhookEvent.updateMany({
        where: {
          provider: "square",
          eventId: eventId
        },
        data: {
          processed: true,
          processedAt: new Date(),
          error: error.message
        }
      });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 处理 webhook 事件的核心逻辑
async function processWebhookEvent(eventType: string, event: any) {
  switch (eventType) {
    case 'payment.completed': {
      const payment = event.data?.object?.payment;
      if (!payment) break;

      console.log('💳 Processing payment completed:', {
        paymentId: payment.id,
        amount: payment.totalMoney?.amount,
        buyerEmail: payment.buyer_email_address
      });

      // 从支付备注中提取用户ID
      const userId = extractUserIdFromPayment(payment);
      if (!userId) {
        console.error('❌ Cannot process payment without user identification');
        break;
      }

      // 检查是否已处理过此支付
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          gatewayTxnId: payment.id,
          gateway: "square"
        }
      });

      if (existingTransaction) {
        console.log(`⏭️ Payment ${payment.id} already processed`);
        break;
      }

      // 更新订阅状态
      await updateSubscription(
        userId,
        "pro",
        "active",
        payment.order_id,
        "square-pro-subscription",
        new Date(),
        undefined
      );

      // 授予积分
      await grantCredits(
        userId,
        200,
        "Square Pro subscription purchase",
        "square",
        payment.id
      );

      console.log(`✅ Square Pro subscription activated for user ${userId}`);
      break;
    }

    case 'subscription.created': {
      const subscription = event.data?.object?.subscription;
      if (!subscription) break;

      console.log('🔄 Processing subscription created:', {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        status: subscription.status
      });

      // 查找关联的用户
      const userId = await findUserIdByCustomerId(subscription.customerId);
      if (!userId) {
        console.error('❌ Cannot find user for subscription');
        break;
      }

      // 更新订阅状态
      await updateSubscription(
        userId,
        "pro",
        subscription.status.toLowerCase(),
        subscription.customerId,
        subscription.id,
        new Date(subscription.startDate),
        subscription.chargedThroughDate ? new Date(subscription.chargedThroughDate) : undefined
      );

      console.log(`✅ Subscription created for user ${userId}`);
      break;
    }

    case 'subscription.updated': {
      const subscription = event.data?.object?.subscription;
      if (!subscription) break;

      console.log('🔄 Processing subscription updated:', {
        subscriptionId: subscription.id,
        status: subscription.status
      });

      // 查找关联的用户
      const userId = await findUserIdBySubscriptionId(subscription.id);
      if (!userId) {
        console.error('❌ Cannot find user for subscription update');
        break;
      }

      // 根据状态更新订阅
      let plan = "pro";
      let status = subscription.status.toLowerCase();
      
      if (subscription.status === "CANCELED") {
        plan = "free";
        status = "canceled";
      }

      await updateSubscription(
        userId,
        plan,
        status,
        subscription.customerId,
        subscription.id,
        new Date(subscription.startDate),
        subscription.chargedThroughDate ? new Date(subscription.chargedThroughDate) : undefined
      );

      console.log(`✅ Subscription updated for user ${userId}: ${status}`);
      break;
    }

    case 'invoice.payment_made': {
      const invoice = event.data?.object?.invoice;
      if (!invoice?.subscription_id) break;

      console.log('💰 Processing invoice payment made:', {
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription_id,
        amount: invoice.invoice_payment_requests?.[0]?.totalMoney?.amount
      });

      // 查找关联的用户
      const userId = await findUserIdBySubscriptionId(invoice.subscription_id);
      if (!userId) {
        console.error('❌ Cannot find user for invoice payment');
        break;
      }

      // 授予月度积分
      await grantCredits(
        userId,
        200,
        "Monthly Pro subscription renewal credits",
        "square",
        invoice.id
      );

      console.log(`✅ Monthly credits granted to user ${userId}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data?.object?.invoice;
      if (!invoice?.subscription_id) break;

      console.log('⚠️ Processing invoice payment failed:', {
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription_id
      });

      // 查找关联的用户
      const userId = await findUserIdBySubscriptionId(invoice.subscription_id);
      if (!userId) {
        console.error('❌ Cannot find user for failed payment');
        break;
      }

      // 标记订阅为逾期
      await updateSubscription(
        userId,
        "pro",
        "past_due",
        undefined,
        invoice.subscription_id,
        undefined,
        undefined
      );

      console.log(`⚠️ Subscription marked as past due for user ${userId}`);
      break;
    }

    default:
      console.log(`ℹ️ Unhandled event type: ${eventType}`);
  }
}

// 辅助函数
function extractUserIdFromPayment(payment: any): string | null {
  // 从支付备注中提取用户ID
  const note = payment.note || '';
  const match = note.match(/User ID: ([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

async function findUserIdByCustomerId(customerId: string): Promise<string | null> {
  const customer = await prisma.customer.findFirst({
    where: { squareCustomerId: customerId }
  });
  return customer?.userId || null;
}

async function findUserIdBySubscriptionId(subscriptionId: string): Promise<string | null> {
  const subscription = await prisma.subscription.findFirst({
    where: { squareSubscriptionId: subscriptionId }
  });
  return subscription?.userId || null;
}
