import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { updateSubscription, getUserWithProfile } from "@/libs/user-service";
import { verifySquareWebhook } from "@/libs/square";
import { createBackendCreditPack, updateBackendAccountPlan } from "@/libs/backend-client";

// Square webhook events we handle for true subscriptions
const RELEVANT_EVENTS = new Set([
  'payment.completed',
  'payment.created',
  'payment.updated',
  'payment.failed',
  'subscription.created',
  'subscription.updated',
  'subscription.paused',
  'subscription.resumed',
  'subscription.canceled',
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
    const webhookSecret = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || process.env.SQUARE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("❌ Missing SQUARE_WEBHOOK_SIGNATURE_KEY");
      return NextResponse.json({ error: "Missing webhook signature key" }, { status: 500 });
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
        
        console.log(`💳 Processing ${eventType} payment:`, {
          paymentId: payment?.id,
          amount: payment?.amount_money?.amount,
          status: payment?.status
        });
        
        // 处理支付事件 - 对于payment.created，状态可能不是COMPLETED
        if (payment?.source_type === 'CARD') {
          
          // 对于payment.created事件，我们也要处理，因为用户已经完成了支付
          if (eventType === 'payment.created' || payment?.status === 'COMPLETED') {
            let userId: string | null = null;
            
            // 首先从payment note中提取用户ID（Square存储用户信息的主要方式）
            if (payment?.note) {
              const userIdMatch = payment.note.match(/User ID: ([a-zA-Z0-9-_]+)/);
              if (userIdMatch) {
                userId = userIdMatch[1];
              }
            }
            
            // 如果payment note中没有，检查reference_id（备用方式）
            if (!userId && payment?.reference_id) {
              userId = payment.reference_id;
            }
            
            // 如果还是没有用户ID，尝试通过邮箱查找用户
            if (!userId && payment.buyer_email_address) {
              const user = await prisma.user.findUnique({
                where: { email: payment.buyer_email_address }
              });
              
              if (user) {
                userId = user.id;
              }
            }
            
            if (userId) {
              console.log(`💳 Processing Square Pro subscription for user ${userId}`);
              
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
              
              // Grant Pro plan subscription
              const updateResult = await updateSubscription(
                userId,
                "pro",
                "active",
                payment.order_id,
                "square-pro-subscription",
                new Date(), // subscriptionStart
                undefined // subscriptionEnd
              );

              if (!updateResult.success) {
                console.error(`❌ Failed to update subscription for user ${userId}:`, updateResult.error);
                throw new Error(`Subscription update failed: ${updateResult.error}`);
              }

              // 注意：Credits现在通过后端credit pack系统统一管理
              // 不再需要前端直接授予credits，由后端同步逻辑处理
              console.log(`✅ Square Pro subscription activated for user ${userId}`);

              // 🔄 后端系统同步
              try {
                const user = await getUserWithProfile(userId);
                const backendAccountId = user?.profile?.preferences?.backendAccountId;

                if (backendAccountId) {
                  console.log(`🔄 Syncing subscription to backend account: ${backendAccountId}`);
                  
                  // 1. 更新后端plan为developer
                  const planSyncResult = await updateBackendAccountPlan({
                    accountId: backendAccountId,
                    plan: "developer" // Pro plan映射到后端的developer
                  });

                  if (planSyncResult.success) {
                    console.log(`✅ Backend plan updated to developer for account ${backendAccountId}`);
                  } else {
                    console.error(`⚠️ Failed to sync plan to backend: ${planSyncResult.error}`);
                  }

                  // 2. 创建30000 credits pack到后端系统（订阅赠送，31天过期）
                  const creditSyncResult = await createBackendCreditPack({
                    accountId: backendAccountId,
                    capacity: 30000,
                    description: "Pro subscription - 30000 credits monthly (31 days expiry)",
                    type: "subscription" // 订阅类型，31天过期
                  });

                  if (creditSyncResult.success) {
                    console.log(`✅ Backend credit pack created: +30000 credits (31 days) for account ${backendAccountId}`);
                  } else {
                    console.error(`⚠️ Failed to create backend credit pack: ${creditSyncResult.error}`);
                  }

                  // 记录同步状态
                  await prisma.transaction.create({
                    data: {
                      userId: userId,
                      type: "backend_sync",
                      amount: 30000,
                      description: "Pro subscription backend sync - plan + credit pack (31 days)",
                      status: "completed",
                      gateway: "square",
                      gatewayTxnId: payment.id,
                      metadata: {
                        backendAccountId: backendAccountId,
                        planSyncSuccess: planSyncResult.success,
                        creditPackSyncSuccess: creditSyncResult.success,
                        planSyncError: planSyncResult.error || null,
                        creditPackSyncError: creditSyncResult.error || null,
                        creditPackId: creditSyncResult.creditPack?.id || null,
                        creditPackType: "subscription",
                        creditPackExpiry: "31_days",
                        syncType: "subscription_activation"
                      }
                    }
                  });
                } else {
                  console.log(`⚠️ No backend account ID found for user ${userId}, skipping backend sync`);
                }
              } catch (syncError) {
                console.error(`❌ Backend sync error for user ${userId}:`, syncError);
                // 不抛出错误，因为前端操作已成功
              }
            } else {
              console.error('❌ Cannot process Square payment: no user identification found');
              console.error('Payment info:', {
                paymentId: payment?.id,
                buyerEmail: payment?.buyer_email_address,
                note: payment?.note
              });
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

      case 'subscription.created': {
        const subscription = event.data?.object?.subscription;
        console.log('🎉 Subscription created:', {
          subscriptionId: subscription?.id,
          customerId: subscription?.customer_id,
          status: subscription?.status,
          startDate: subscription?.start_date
        });

        // Update local subscription record
        if (subscription?.id) {
          await prisma.subscription.updateMany({
            where: { squareSubscriptionId: subscription.id },
            data: {
              status: subscription.status || 'active',
              currentPeriodStart: subscription.start_date ? new Date(subscription.start_date) : undefined,
              currentPeriodEnd: subscription.charged_through_date ? new Date(subscription.charged_through_date) : undefined,
              nextInvoiceDate: subscription.invoice_request_method ? new Date(subscription.charged_through_date) : undefined
            }
          });

          // Grant initial subscription credits
          const subscriptionRecord = await prisma.subscription.findFirst({
            where: { squareSubscriptionId: subscription.id },
            include: { user: { include: { profile: true } } }
          });

          if (subscriptionRecord) {
            console.log(`🎁 Granting initial subscription credits to user ${subscriptionRecord.userId}`);
            // Grant 30,000 credits for Pro subscription
            await updateSubscription(
              subscriptionRecord.userId,
              'pro',
              'active',
              subscription.customer_id,
              subscription.plan_variation_id,
              new Date(subscription.start_date),
              subscription.charged_through_date ? new Date(subscription.charged_through_date) : undefined
            );
          }
        }
        break;
      }

      case 'subscription.updated': {
        const subscription = event.data?.object?.subscription;
        console.log('🔄 Subscription updated:', {
          subscriptionId: subscription?.id,
          status: subscription?.status,
          chargedThroughDate: subscription?.charged_through_date
        });

        if (subscription?.id) {
          await prisma.subscription.updateMany({
            where: { squareSubscriptionId: subscription.id },
            data: {
              status: subscription.status || 'active',
              currentPeriodEnd: subscription.charged_through_date ? new Date(subscription.charged_through_date) : undefined
            }
          });
        }
        break;
      }

      case 'subscription.paused': {
        const subscription = event.data?.object?.subscription;
        console.log('⏸️ Subscription paused:', {
          subscriptionId: subscription?.id,
          pauseEffectiveDate: subscription?.pause_effective_date
        });

        if (subscription?.id) {
          await prisma.subscription.updateMany({
            where: { squareSubscriptionId: subscription.id },
            data: { status: 'paused' }
          });

          // Update user profile to reflect paused status
          const subscriptionRecord = await prisma.subscription.findFirst({
            where: { squareSubscriptionId: subscription.id }
          });

          if (subscriptionRecord) {
            await updateSubscription(
              subscriptionRecord.userId,
              'free', // Downgrade to free plan
              'paused'
            );
          }
        }
        break;
      }

      case 'subscription.resumed': {
        const subscription = event.data?.object?.subscription;
        console.log('▶️ Subscription resumed:', {
          subscriptionId: subscription?.id,
          resumeEffectiveDate: subscription?.resume_effective_date
        });

        if (subscription?.id) {
          await prisma.subscription.updateMany({
            where: { squareSubscriptionId: subscription.id },
            data: { status: 'active' }
          });

          // Update user profile to reflect active status
          const subscriptionRecord = await prisma.subscription.findFirst({
            where: { squareSubscriptionId: subscription.id }
          });

          if (subscriptionRecord) {
            await updateSubscription(
              subscriptionRecord.userId,
              'pro', // Restore to pro plan
              'active'
            );
          }
        }
        break;
      }

      case 'subscription.canceled': {
        const subscription = event.data?.object?.subscription;
        console.log('❌ Subscription canceled:', {
          subscriptionId: subscription?.id,
          canceledDate: subscription?.canceled_date
        });

        if (subscription?.id) {
          await prisma.subscription.updateMany({
            where: { squareSubscriptionId: subscription.id },
            data: { 
              status: 'canceled',
              cancelAtPeriodEnd: true
            }
          });

          // Update user profile to reflect canceled status
          const subscriptionRecord = await prisma.subscription.findFirst({
            where: { squareSubscriptionId: subscription.id }
          });

          if (subscriptionRecord) {
            await updateSubscription(
              subscriptionRecord.userId,
              'free', // Downgrade to free plan
              'canceled'
            );
          }
        }
        break;
      }

      case 'invoice.published': {
        const invoice = event.data?.object?.invoice;
        console.log('📄 Invoice published:', {
          invoiceId: invoice?.id,
          subscriptionId: invoice?.subscription_id,
          dueDate: invoice?.next_payment_amount_money
        });
        break;
      }

      case 'invoice.payment_made': {
        const invoice = event.data?.object?.invoice;
        console.log('💰 Invoice payment made:', {
          invoiceId: invoice?.id,
          subscriptionId: invoice?.subscription_id,
          amount: invoice?.next_payment_amount_money?.amount
        });

        // This is a recurring subscription payment - grant monthly credits
        if (invoice?.subscription_id) {
          const subscriptionRecord = await prisma.subscription.findFirst({
            where: { squareSubscriptionId: invoice.subscription_id }
          });

          if (subscriptionRecord) {
            console.log(`💳 Processing recurring payment for subscription ${invoice.subscription_id}`);
            // Grant monthly credits for Pro users (30,000 credits per month)
            await updateSubscription(
              subscriptionRecord.userId,
              'pro',
              'active'
            );

            // Sync to backend system
            try {
              const user = await getUserWithProfile(subscriptionRecord.userId);
              const backendAccountId = user?.profile?.preferences?.backendAccountId;

              if (backendAccountId) {
                console.log(`🔄 Syncing recurring subscription payment to backend account: ${backendAccountId}`);
                
                const creditSyncResult = await createBackendCreditPack({
                  accountId: backendAccountId,
                  capacity: 30000,
                  description: "Pro subscription - Monthly credit renewal (31 days expiry)",
                  type: "subscription"
                });

                if (creditSyncResult.success) {
                  console.log(`✅ Backend credit pack created for recurring payment: +30000 credits for account ${backendAccountId}`);
                }
              }
            } catch (syncError) {
              console.error(`❌ Backend sync error for recurring payment:`, syncError);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data?.object?.invoice;
        console.log('⚠️ Invoice payment failed:', {
          invoiceId: invoice?.id,
          subscriptionId: invoice?.subscription_id
        });

        // Mark subscription as past due
        if (invoice?.subscription_id) {
          const subscriptionRecord = await prisma.subscription.findFirst({
            where: { squareSubscriptionId: invoice.subscription_id }
          });

          if (subscriptionRecord) {
            await updateSubscription(
              subscriptionRecord.userId,
              subscriptionRecord.name === 'Pro Plan' ? 'pro' : 'free',
              'past_due'
            );
          }
        }
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
