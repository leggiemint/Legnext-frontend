import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/libs/prisma";
import { updateSubscription } from "@/libs/user-service";
import { updateBackendAccountPlan, createBackendCreditPack } from "@/libs/backend-client";

// STRIPE PAYMENT GATEWAY - Primary payment processing

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// 处理订阅激活的通用函数
async function processSubscriptionActivation(userId: string, customerId: string, session: Stripe.Checkout.Session) {
  console.log(`💳 Processing subscription activation for user ${userId}, customer ${customerId}`);

  // Get the subscription to get the price ID
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  console.log(`📋 Subscription details:`, {
    subscriptionId,
    priceId,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000)
  });

  // Get user profile to check backend account ID
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId },
    include: { user: true }
  });

  if (!userProfile) {
    console.error(`❌ User profile not found for user ${userId}`);
    throw new Error(`User profile not found for user ${userId}`);
  }

  // Update subscription status only (credits are managed by backend system)
  const updateResult = await updateSubscription(
    userId,
    "pro",
    "active",
    customerId,
    priceId,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000)
  );

  if (!updateResult.success) {
    console.error(`❌ Failed to update subscription for user ${userId}:`, updateResult.error);
    throw new Error(`Subscription update failed: ${updateResult.error}`);
  }

  console.log(`✅ Pro subscription activated for user ${userId} (credits managed by backend system)`);

  // 🔄 同步到后端系统
  const backendAccountId = userProfile.preferences && typeof userProfile.preferences === 'object' && 'backendAccountId' in userProfile.preferences 
    ? (userProfile.preferences as any).backendAccountId 
    : null;
  
  // 如果没有backendAccountId，尝试通过email查找
  if (!backendAccountId) {
    console.log(`🔍 No backendAccountId found, attempting to find by email: ${userProfile.user?.email}`);
    
    try {
      const { getBackendAccountByEmail } = await import('@/libs/backend-client');
      const accountResult = await getBackendAccountByEmail(userProfile.user?.email || '');
      
      if (accountResult.success && accountResult.account?.id) {
        console.log(`✅ Found backend account by email: ${accountResult.account.id}`);
        
        // 更新用户preferences中的backendAccountId
        await prisma.userProfile.update({
          where: { userId },
          data: {
            preferences: {
              ...(userProfile.preferences as object || {}),
              backendAccountId: accountResult.account.id
            }
          }
        });
        
        // 继续处理后端同步
        await syncToBackend(accountResult.account.id, userId, session.id, subscriptionId);
      } else {
        console.error(`❌ No backend account found for email: ${userProfile.user?.email}`);
      }
    } catch (error) {
      console.error(`❌ Error finding backend account by email:`, error);
    }
  } else {
    // 有backendAccountId，直接同步
    await syncToBackend(backendAccountId, userId, session.id, subscriptionId);
  }
}

// 提取后端同步逻辑到单独函数
async function syncToBackend(backendAccountId: number, userId: string, sessionId: string, subscriptionId: string) {
  console.log(`🔄 Starting backend sync for account: ${backendAccountId}`);
  
  try {
    // 验证后端配置
    const { validateBackendConfig } = await import('@/libs/backend-client');
    const configCheck = validateBackendConfig();
    
    if (!configCheck.isValid) {
      console.error(`❌ Invalid backend configuration: ${configCheck.error}`);
      throw new Error(`Backend configuration invalid: ${configCheck.error}`);
    }
    
    // 1. 更新后端账户计划为 developer
    console.log(`🔄 Updating backend plan to developer...`);
    
    const planUpdateResult = await updateBackendAccountPlan({
      accountId: backendAccountId,
      newPlan: "developer"
    });

    if (planUpdateResult.success) {
      console.log(`✅ Backend plan updated to developer for account ${backendAccountId}`);
    } else {
      console.error(`⚠️ Failed to update backend plan: ${planUpdateResult.error}`);
    }

    // 2. 创建33000 credits pack，有效期31天
    console.log(`🔄 Creating 33000 credits pack...`);
    
    const creditPackResult = await createBackendCreditPack({
      accountId: backendAccountId,
      capacity: 33000,
      description: "Pro subscription credits pack - 31 days",
      type: "subscription" // 31天有效期
    });

    if (creditPackResult.success) {
      console.log(`✅ Backend credit pack created: 33000 credits for account ${backendAccountId}`);
    } else {
      console.error(`⚠️ Failed to create backend credit pack: ${creditPackResult.error}`);
    }

    // 记录同步结果
    await prisma.transaction.create({
      data: {
        userId: userId,
        type: "subscription",
        amount: 0,
        description: "Pro subscription activated with backend sync",
        status: (planUpdateResult.success && creditPackResult.success) ? "completed" : "partial",
        gateway: "stripe",
        gatewayTxnId: sessionId,
        subscriptionId: subscriptionId,
        metadata: {
          backendAccountId: backendAccountId,
          planUpdateSuccess: planUpdateResult.success,
          planUpdateError: planUpdateResult.error,
          creditPackSuccess: creditPackResult.success,
          creditPackError: creditPackResult.error,
          creditPackId: creditPackResult.creditPack?.id
        }
      }
    });

  } catch (backendError) {
    console.error(`❌ Backend sync failed for user ${userId}:`, backendError);
    // 不抛出错误，因为前端订阅已经成功
  }
}

export async function POST(req: NextRequest) {
  console.log("🔔 Stripe webhook received!");
  
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  console.log("Body length:", body.length);
  console.log("Signature present:", !!signature);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`✅ Webhook verified, event type: ${event.type}, event ID: ${event.id}`);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    // Prevent duplicate processing
    const existingEvent = await prisma.webhookEvent.findFirst({
      where: {
        provider: "stripe",
        eventId: event.id
      }
    });

    if (existingEvent) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Record webhook event
    await prisma.webhookEvent.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        processed: false
      }
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log(`🎯 Processing checkout.session.completed:`, {
          mode: session.mode,
          customerId: session.customer,
          clientReferenceId: session.client_reference_id,
          customerEmail: session.customer_details?.email,
          sessionId: session.id
        });
        
        if (session.mode === "subscription") {
          const customerId = session.customer as string;
          const userId = session.client_reference_id;
          
          if (!userId) {
            console.error("❌ No user ID in checkout session, trying to find user by email...");
            
            // 尝试通过邮箱找到用户
            const customerEmail = session.customer_details?.email;
            if (customerEmail) {
              const user = await prisma.user.findUnique({
                where: { email: customerEmail }
              });
              
              if (user) {
                console.log(`✅ Found user by email: ${user.id} (${customerEmail})`);
                // 继续处理，使用找到的用户ID
                await processSubscriptionActivation(user.id, customerId, session);
                break;
              } else {
                console.error(`❌ No user found with email: ${customerEmail}`);
              }
            }
            
            console.error("❌ Cannot process subscription without user identification");
            break;
          }

          // 使用通用函数处理订阅激活
          await processSubscriptionActivation(userId, customerId, session);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        const customer = await prisma.customer.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        });
        
        if (!customer) break;
        
        const profile = await prisma.userProfile.findFirst({
          where: { userId: customer.userId }
        });

        if (!profile) break;

        let status = "active";
        if (subscription.status === "canceled") status = "canceled";
        else if (subscription.status === "past_due") status = "past_due";

        await updateSubscription(
          profile.userId,
          subscription.status === "active" ? "pro" : "free",
          status,
          subscription.customer as string,
          subscription.items.data[0]?.price.id,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000)
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        const customer = await prisma.customer.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        });
        
        if (!customer) break;
        
        const profile = await prisma.userProfile.findFirst({
          where: { userId: customer.userId },
          include: { user: true }
        });

        if (!profile) break;

        // 更新前端订阅状态
        await updateSubscription(
          profile.userId,
          "free",
          "canceled",
          subscription.customer as string,
          undefined,
          undefined,
          undefined
        );

        console.log(`✅ Frontend subscription canceled for user: ${profile.user?.email}`);

        // 🔄 同步取消状态到后端系统
        const backendAccountId = profile.preferences && typeof profile.preferences === 'object' && 'backendAccountId' in profile.preferences 
          ? (profile.preferences as any).backendAccountId 
          : null;
        
        if (backendAccountId) {
          console.log(`🔄 Syncing cancellation to backend account: ${backendAccountId}`);
          
          try {
            // 将后端账户计划降级为 hobbyist
            const planUpdateResult = await updateBackendAccountPlan({
              accountId: backendAccountId,
              newPlan: "hobbyist"
            });

            if (planUpdateResult.success) {
              console.log(`✅ Backend plan downgraded to hobbyist for account ${backendAccountId}`);
            } else {
              console.error(`⚠️ Failed to downgrade backend plan: ${planUpdateResult.error}`);
            }

            // 记录取消同步结果
            await prisma.transaction.create({
              data: {
                userId: profile.userId,
                type: "subscription_cancellation",
                amount: 0,
                description: "Subscription canceled with backend sync",
                status: planUpdateResult.success ? "completed" : "partial",
                gateway: "stripe",
                gatewayTxnId: subscription.id,
                metadata: {
                  backendAccountId: backendAccountId,
                  planUpdateSuccess: planUpdateResult.success,
                  planUpdateError: planUpdateResult.error,
                  canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : new Date()
                }
              }
            });

          } catch (backendError) {
            console.error(`❌ Backend cancellation sync failed for user ${profile.userId}:`, backendError);
          }
        }

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
          // Only process recurring subscription payments, not the initial payment
          const customer = await prisma.customer.findFirst({
            where: { stripeCustomerId: invoice.customer as string }
          });
          
          if (!customer) return;
          
          const profile = await prisma.userProfile.findFirst({
            where: { userId: customer.userId }
          });

          if (profile && profile.plan === "pro") {
            console.log(`💰 Processing monthly subscription renewal for user ${profile.userId} (credits managed by backend system)`);

            // 🔄 同步月度续费到后端系统
            const backendAccountId = profile.preferences && typeof profile.preferences === 'object' && 'backendAccountId' in profile.preferences 
              ? (profile.preferences as any).backendAccountId 
              : null;
            
            if (backendAccountId) {
              console.log(`🔄 Syncing monthly renewal to backend account: ${backendAccountId}`);
              
              try {
                // 1. 确保后端计划为 developer
                console.log(`🔄 Ensuring backend plan is developer for account: ${backendAccountId}`);
                const planUpdateResult = await updateBackendAccountPlan({
                  accountId: backendAccountId,
                  newPlan: "developer"
                });

                if (planUpdateResult.success) {
                  console.log(`✅ Backend plan confirmed as developer for account ${backendAccountId}`);
                } else {
                  console.error(`⚠️ Failed to update backend plan: ${planUpdateResult.error}`);
                }

                // 2. 创建月度credits pack，有效期31天
                console.log(`🔄 Creating monthly credit pack for account: ${backendAccountId}`);
                const creditPackResult = await createBackendCreditPack({
                  accountId: backendAccountId,
                  capacity: 33000,
                  description: "Monthly Pro subscription renewal - 31 days",
                  type: "subscription" // 31天有效期
                });

                if (creditPackResult.success) {
                  console.log(`✅ Monthly backend credit pack created: 33000 credits for account ${backendAccountId}`);
                } else {
                  console.error(`⚠️ Failed to create monthly backend credit pack: ${creditPackResult.error}`);
                }

                // 记录月度续费同步结果
                await prisma.transaction.create({
                  data: {
                    userId: profile.userId,
                    type: "subscription",
                    amount: 0,
                    description: "Monthly Pro subscription renewal with backend sync",
                    status: (planUpdateResult.success && creditPackResult.success) ? "completed" : "partial",
                    gateway: "stripe",
                    gatewayTxnId: invoice.id,
                    subscriptionId: invoice.subscription as string,
                    metadata: {
                      backendAccountId: backendAccountId,
                      planUpdateSuccess: planUpdateResult.success,
                      planUpdateError: planUpdateResult.error,
                      creditPackSuccess: creditPackResult.success,
                      creditPackError: creditPackResult.error,
                      creditPackId: creditPackResult.creditPack?.id,
                      renewalType: "monthly"
                    }
                  }
                });

              } catch (backendError) {
                console.error(`❌ Monthly backend sync failed for user ${profile.userId}:`, backendError);
                // 不抛出错误，因为前端续费已经成功
              }
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        
        const customer = await prisma.customer.findFirst({
          where: { stripeCustomerId: invoice.customer as string }
        });
        
        if (!customer) break;
        
        const profile = await prisma.userProfile.findFirst({
          where: { userId: customer.userId }
        });

        if (profile) {
          await updateSubscription(
            profile.userId,
            profile.plan,
            "past_due",
            undefined,
            undefined,
            undefined,
            undefined
          );
        }
        break;
      }
    }

    // Mark as processed
    await prisma.webhookEvent.updateMany({
      where: {
        provider: "stripe",
        eventId: event.id
      },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error(`Webhook error:`, error);
    
    // Update webhook event with error
    await prisma.webhookEvent.updateMany({
      where: {
        provider: "stripe",
        eventId: event.id
      },
      data: {
        processed: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
