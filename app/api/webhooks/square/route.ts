import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { updateSubscription, grantCredits } from "@/libs/user-service";
import { verifySquareWebhook } from "@/libs/square";

// Square webhook events we handle
const RELEVANT_EVENTS = new Set([
  'payment.completed',
  'payment.created',  // 添加payment.created事件
  'payment.updated',  // 添加payment.updated事件
  'payment.failed',
  'subscription.created',
  'subscription.updated',
  'subscription.canceled',
  'invoice.payment_made'
]);

export async function POST(req: NextRequest) {
  let eventType: string | null = null;
  let event: any = null;
  let eventId: string | null = null;

  try {
    console.log("🔔 Square webhook received - starting processing...");
    
    const body = await req.text();
    const signature = req.headers.get("x-square-hmacsha256-signature");

    console.log("📋 Webhook headers:", {
      contentType: req.headers.get("content-type"),
      signature: signature ? "Present" : "Missing",
      userAgent: req.headers.get("user-agent"),
      host: req.headers.get("host")
    });

    if (!signature) {
      console.error("❌ Missing Square signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("❌ Missing SQUARE_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
    }

    console.log("🔐 Attempting to verify webhook signature...");
    const isValid = verifySquareWebhook(body, signature, webhookSecret);
    if (!isValid) {
      console.error("❌ Invalid Square webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Parse event data
    try {
      event = JSON.parse(body);
      eventType = event.type;
      eventId = event.event_id;
    } catch (parseError) {
      console.error("❌ Failed to parse webhook body:", parseError);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log(`🔔 Square webhook received: ${eventType}`, {
      eventId: eventId,
      merchantId: event.merchant_id,
      locationId: event.location_id,
      createdAt: event.created_at
    });

    // 添加详细的事件数据结构日志
    console.log(`📋 Event data structure:`, {
      hasData: !!event.data,
      hasObject: !!event.data?.object,
      hasPayment: !!event.data?.object?.payment,
      dataKeys: event.data ? Object.keys(event.data) : [],
      objectKeys: event.data?.object ? Object.keys(event.data.object) : []
    });

    if (!RELEVANT_EVENTS.has(eventType)) {
      console.log(`⏭️ Ignoring irrelevant Square event: ${eventType}`);
      return NextResponse.json({ received: true });
    }

    // Prevent duplicate processing
    const existingEvent = await prisma.webhookEvent.findFirst({
      where: {
        provider: "square",
        eventId: eventId
      }
    });

    if (existingEvent) {
      console.log(`⏭️ Square webhook ${eventId} already processed`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Record webhook event
    await prisma.webhookEvent.create({
      data: {
        provider: "square",
        eventId: eventId,
        eventType: eventType,
        processed: false
      }
    });

    // Process different event types
    switch (eventType) {
      case 'payment.completed':
      case 'payment.created':
      case 'payment.updated': {
        // 根据Square文档，payment数据位于event.data.object.payment
        const payment = event.data?.object?.payment;
        
        console.log(`🎯 Processing ${eventType}:`, {
          paymentId: payment?.id,
          sourceType: payment?.source_type,
          amount: payment?.amount_money,
          status: payment?.status,
          referenceId: payment?.reference_id,
          orderId: payment?.order_id,
          buyerEmailAddress: payment?.buyer_email_address,
          note: payment?.note
        });

        // 添加支付对象的详细调试信息
        if (payment) {
          console.log(`🔍 Payment object details:`, {
            id: payment.id,
            status: payment.status,
            sourceType: payment.source_type,
            amountMoney: payment.amount_money,
            note: payment.note,
            buyerEmailAddress: payment.buyer_email_address,
            orderId: payment.order_id,
            allKeys: Object.keys(payment)
          });
        } else {
          console.log(`❌ No payment object found in event data`);
        }
        
        // 处理支付事件 - 对于payment.created，状态可能不是COMPLETED
        if (payment?.source_type === 'CARD') {
          console.log(`🔍 Payment status: ${payment.status}, event type: ${eventType}`);
          
          // 对于payment.created事件，我们也要处理，因为用户已经完成了支付
          if (eventType === 'payment.created' || payment?.status === 'COMPLETED') {
            let userId: string | null = null;
            
            // 首先从payment note中提取用户ID（Square存储用户信息的主要方式）
            if (payment?.note) {
              console.log(`🔍 Checking payment note for user ID: ${payment.note}`);
              const userIdMatch = payment.note.match(/User ID: ([a-zA-Z0-9-_]+)/);
              if (userIdMatch) {
                userId = userIdMatch[1];
                console.log(`✅ Found user ID in payment note: ${userId}`);
              }
            }
            
            // 如果payment note中没有，检查reference_id（备用方式）
            if (!userId && payment?.reference_id) {
              userId = payment.reference_id;
              console.log(`✅ Found user ID in reference_id: ${userId}`);
            }
            
            // 如果还是没有用户ID，尝试通过邮箱查找用户
            if (!userId && payment.buyer_email_address) {
              console.log(`🔍 No reference_id, trying to find user by email: ${payment.buyer_email_address}`);
              
              const user = await prisma.user.findUnique({
                where: { email: payment.buyer_email_address }
              });
              
              if (user) {
                userId = user.id;
                console.log(`✅ Found user by email: ${user.id} (${payment.buyer_email_address})`);
              } else {
                console.error(`❌ No user found with email: ${payment.buyer_email_address}`);
              }
            }
            
            if (userId) {
              console.log(`💳 Processing Square Pro subscription for user ${userId}`);
              console.log(`💳 Payment details:`, {
                paymentId: payment.id,
                amount: payment.amount_money,
                status: payment.status,
                userId: userId
              });
              
              // Check if payment was already processed to avoid duplicates
              const existingTransaction = await prisma.transaction.findFirst({
                where: {
                  gatewayTxnId: payment.id,
                  gateway: "square"
                }
              });

              if (existingTransaction) {
                console.log(`⏭️ Payment ${payment.id} already processed, skipping`);
                break;
              }
              
              // Grant Pro plan subscription (simplified logic)
              console.log(`📝 Updating user ${userId} subscription to Pro plan...`);
              const updateResult = await updateSubscription(
                userId,
                "pro",
                "active",
                payment.order_id, // Use order ID as customer reference
                "square-pro-subscription"
              );

              if (!updateResult.success) {
                console.error(`❌ Failed to update subscription for user ${userId}:`, updateResult.error);
                throw new Error(`Subscription update failed: ${updateResult.error}`);
              }
              console.log(`✅ Subscription updated successfully for user ${userId}`);

              // Grant Pro plan credits (200 credits - user already has 60 free credits)
              console.log(`💰 Granting 200 credits to user ${userId}...`);
              const creditResult = await grantCredits(
                userId,
                200, // 200 credits for Pro subscription
                "Square Pro subscription purchase",
                "square",
                payment.id
              );

              if (!creditResult.success) {
                console.error(`❌ Failed to grant credits to user ${userId}:`, creditResult.error);
                throw new Error(`Credit grant failed: ${creditResult.error}`);
              }

              console.log(`✅ Square Pro subscription activated for user ${userId}`);
              console.log(`💰 Credits granted: 200, new balance: ${creditResult.newBalance}`);
            } else {
              console.error('❌ Cannot process Square payment without user identification');
              console.error('Payment debugging info:', {
                paymentId: payment?.id,
                referenceId: payment?.reference_id,
                note: payment?.note,
                buyerEmail: payment?.buyer_email_address,
                status: payment?.status,
                eventType: eventType,
                fullPaymentObject: JSON.stringify(payment, null, 2)
              });
              
              // Don't throw error, just log it so webhook is marked as processed
              console.error('⚠️ Webhook processed but payment could not be linked to user');
            }
          }
        }
        break;
      }

      case 'payment.failed': {
        // Handle failed payment
        console.log('Payment failed:', event.data?.object?.id);
        break;
      }

      default:
        console.log(`Unhandled Square event type: ${eventType}`);
    }

    // Mark as processed
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
    
    // Mark as processed with error
    if (eventId) {
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
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
