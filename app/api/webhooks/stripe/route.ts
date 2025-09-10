import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/libs/prisma";
import { updateSubscription, grantCredits } from "@/libs/user-service";
import { updateBackendAccountPlan, createBackendCreditPack } from "@/libs/backend-client";

// STRIPE PAYMENT GATEWAY - Primary payment processing

// Environment validation
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required but not configured");
}

if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is required but not configured");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-08-16",
});

// 处理订阅激活的通用函数
async function processSubscriptionActivation(userId: string, customerId: string, session: Stripe.Checkout.Session) {
  console.log(`💳 [DEBUG] Processing subscription activation for user ${userId}, customer ${customerId}`);
  console.log(`💳 [DEBUG] Session details:`, {
    sessionId: session.id,
    mode: session.mode,
    paymentStatus: session.payment_status,
    status: session.status,
    subscriptionRaw: session.subscription
  });

  // Get the subscription to get the price ID
  const subscriptionId = session.subscription as string;
  console.log(`🔍 [DEBUG] Retrieving subscription details for ID: ${subscriptionId}`);
  
  if (!subscriptionId) {
    console.error(`❌ [ERROR] No subscription ID found in session`);
    throw new Error('No subscription ID found in checkout session');
  }
  
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  console.log(`📋 Subscription details:`, {
    subscriptionId,
    priceId,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    customer: subscription.customer
  });

  // Get user profile to check backend account ID
  console.log(`🔍 Looking up user profile for userId: ${userId}`);
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId },
    include: { user: true }
  });

  if (!userProfile) {
    console.error(`❌ User profile not found for user ${userId}`);
    throw new Error(`User profile not found for user ${userId}`);
  }

  console.log(`👤 User profile found:`, {
    userId: userProfile.userId,
    currentPlan: userProfile.plan,
    credits: userProfile.credits,
    userEmail: userProfile.user?.email,
    preferences: userProfile.preferences
  });

  // Use database transaction to ensure atomicity of subscription update and credit grant
  console.log(`🔄 [DEBUG] Starting atomic subscription activation for user ${userId}...`);
  
  const subscriptionResult = await prisma.$transaction(async () => {
    console.log(`💳 [TRANSACTION] Updating subscription for user ${userId} to pro plan...`);
    
    // Update subscription status and store Stripe customer ID
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
      console.error(`❌ [TRANSACTION] Failed to update subscription for user ${userId}:`, updateResult.error);
      throw new Error(`Subscription update failed: ${updateResult.error}`);
    }

    console.log(`💰 [TRANSACTION] Granting 200 credits to user ${userId}...`);
    
    // Grant Pro plan credits (200 credits)
    const creditResult = await grantCredits(
      userId,
      200,
      "Pro subscription credits",
      "stripe",
      session.id
    );

    if (!creditResult.success) {
      console.error(`❌ [TRANSACTION] Failed to grant credits to user ${userId}:`, creditResult.error);
      throw new Error(`Credit grant failed: ${creditResult.error}`);
    }

    console.log(`✅ [TRANSACTION] Subscription and credits processed successfully`);
    return {
      subscriptionSuccess: updateResult.success,
      creditSuccess: creditResult.success,
      newBalance: creditResult.newBalance
    };
  });

  console.log(`📊 Atomic subscription result:`, {
    subscriptionSuccess: subscriptionResult.subscriptionSuccess,
    creditSuccess: subscriptionResult.creditSuccess,
    newBalance: subscriptionResult.newBalance
  });

  console.log(`✅ Pro subscription activated for user ${userId}, new credit balance: ${subscriptionResult.newBalance}`);

  // 🔄 同步到后端系统
  console.log(`🔍 Checking backend account ID in user preferences...`);
  const backendAccountId = userProfile.preferences && typeof userProfile.preferences === 'object' && 'backendAccountId' in userProfile.preferences 
    ? (userProfile.preferences as any).backendAccountId 
    : null;
  
  console.log(`📊 Backend account ID:`, {
    found: !!backendAccountId,
    accountId: backendAccountId,
    preferencesType: typeof userProfile.preferences,
    fullPreferences: userProfile.preferences
  });
  
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
        
        // 使用找到的账户ID
        const foundAccountId = accountResult.account.id;
        console.log(`🔄 Using found backend account ID: ${foundAccountId}`);
        
        // 继续处理后端同步
        await syncToBackend(foundAccountId, userId, session.id, subscriptionId);
      } else {
        console.error(`❌ No backend account found for email: ${userProfile.user?.email}`);
        console.log(`⚠️ Skipping backend sync - no account found`);
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
  console.log(`🔄 [BACKEND-SYNC] Starting backend sync for account: ${backendAccountId}`);
  console.log(`🔄 [BACKEND-SYNC] Sync parameters:`, {
    backendAccountId,
    userId,
    sessionId,
    subscriptionId,
    timestamp: new Date().toISOString()
  });
  
  try {
    // 验证后端配置
    const { validateBackendConfig } = await import('@/libs/backend-client');
    const configCheck = validateBackendConfig();
    console.log(`🔧 [BACKEND-CONFIG] Configuration check:`, configCheck);
    
    if (!configCheck.isValid) {
      console.error(`❌ [BACKEND-CONFIG] Invalid backend configuration: ${configCheck.error}`);
      throw new Error(`Backend configuration invalid: ${configCheck.error}`);
    }
    
    // 1. 更新后端账户计划为 developer
    console.log(`🔄 [BACKEND-STEP-1] Updating backend plan to developer...`);
    console.log(`🔄 [BACKEND-STEP-1] Plan update parameters:`, {
      accountId: backendAccountId,
      newPlan: "developer"
    });
    
    const planUpdateResult = await updateBackendAccountPlan({
      accountId: backendAccountId,
      newPlan: "developer"
    });

    console.log(`📊 Backend plan update result:`, {
      success: planUpdateResult.success,
      error: planUpdateResult.error,
      account: planUpdateResult.account
    });

    if (planUpdateResult.success) {
      console.log(`✅ Backend plan updated to developer for account ${backendAccountId}`);
    } else {
      console.error(`⚠️ Failed to update backend plan: ${planUpdateResult.error}`);
    }

    // 2. 创建33000 credits pack，有效期31天
    console.log(`🔄 [BACKEND-STEP-2] Creating 33000 credits pack...`);
    console.log(`🔄 [BACKEND-STEP-2] Credit pack parameters:`, {
      accountId: backendAccountId,
      capacity: 33000,
      description: "Pro subscription credits pack - 31 days",
      type: "subscription"
    });
    
    const creditPackResult = await createBackendCreditPack({
      accountId: backendAccountId,
      capacity: 33000,
      description: "Pro subscription credits pack - 31 days",
      type: "subscription" // 31天有效期
    });

    console.log(`📊 Backend credit pack result:`, {
      success: creditPackResult.success,
      error: creditPackResult.error,
      creditPack: creditPackResult.creditPack
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
    console.error(`❌ [BACKEND-SYNC] Backend sync failed for user ${userId}:`, {
      error: backendError.message || backendError,
      stack: backendError.stack,
      backendAccountId,
      userId,
      sessionId,
      subscriptionId,
      timestamp: new Date().toISOString()
    });
    // 不抛出错误，因为前端订阅已经成功
  }
}

export async function POST(req: NextRequest) {
  console.log("🔔 [WEBHOOK] Stripe webhook received!");
  console.log("🔧 [WEBHOOK] Environment check:", {
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + "...",
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    nodeEnv: process.env.NODE_ENV
  });
  
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  console.log("📊 [WEBHOOK] Webhook details:", {
    bodyLength: body.length,
    signaturePresent: !!signature,
    signaturePrefix: signature?.substring(0, 20) + "...",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: headers().get("user-agent"),
    contentType: headers().get("content-type")
  });

  if (!signature) {
    console.error("❌ [WEBHOOK] No stripe-signature header found!");
    return NextResponse.json({ error: "No signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`✅ Webhook verified successfully:`, {
      eventType: event.type,
      eventId: event.id,
      created: new Date(event.created * 1000).toISOString()
    });
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, {
      error: err.message,
      bodyLength: body.length,
      signaturePresent: !!signature
    });
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    console.log("🔍 [WEBHOOK] Processing event with transaction...");
    
    // Use database transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing event within transaction
      const existingEvent = await tx.webhookEvent.findFirst({
        where: {
          provider: "stripe",
          eventId: event.id,
        },
      });

      if (existingEvent) {
        console.log("⚠️ [WEBHOOK] Duplicate event detected, skipping processing:", {
          eventId: event.id,
          eventType: event.type,
          existingEventId: existingEvent.id,
          existingCreatedAt: existingEvent.createdAt,
        });
        return { duplicate: true };
      }

      // Create webhook event record within transaction
      await tx.webhookEvent.create({
        data: {
          provider: "stripe",
          eventId: event.id,
          eventType: event.type,
          processed: false,
          metadata: event as any,
        },
      });

      return { duplicate: false };
    });

    if (result.duplicate) {
      return NextResponse.json(
        { received: true, duplicate: true },
        { status: 200 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log(`🎯 Processing checkout.session.completed:`, {
          mode: session.mode,
          customerId: session.customer,
          clientReferenceId: session.client_reference_id,
          customerEmail: session.customer_details?.email,
          sessionId: session.id,
          paymentStatus: session.payment_status,
          subscriptionId: session.subscription
        });
        
        if (session.mode === "subscription") {
          console.log(`🔄 Processing subscription checkout...`);
          
          const customerId = session.customer as string;
          const userId = session.client_reference_id;
          
          console.log(`👤 [WEBHOOK] User identification:`, {
            userId: userId,
            customerId: customerId,
            customerEmail: session.customer_details?.email,
            subscriptionId: session.subscription,
            paymentStatus: session.payment_status,
            sessionStatus: session.status
          });
          
          if (!userId) {
            console.error("❌ No user ID in checkout session, trying to find user by email...");
            
            // 尝试通过邮箱找到用户
            const customerEmail = session.customer_details?.email;
            if (customerEmail) {
              console.log(`🔍 Searching for user by email: ${customerEmail}`);
              
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

          console.log(`🚀 Starting subscription activation for user: ${userId}`);
          // 使用通用函数处理订阅激活
          await processSubscriptionActivation(userId, customerId, session);
          console.log(`✅ Subscription activation completed for user: ${userId}`);
        } else {
          console.log(`ℹ️ Non-subscription checkout session, skipping subscription processing`);
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
        
        console.log(`🚫 [WEBHOOK] Processing subscription cancellation:`, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
        });
        
        const customer = await prisma.customer.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        });
        
        if (!customer) {
          console.log(`⚠️ [WEBHOOK] No customer found for Stripe customer ID: ${subscription.customer}`);
          break;
        }
        
        const profile = await prisma.userProfile.findFirst({
          where: { userId: customer.userId },
          include: { user: true }
        });

        if (!profile) {
          console.log(`⚠️ [WEBHOOK] No user profile found for user ID: ${customer.userId}`);
          break;
        }

        console.log(`🔄 [WEBHOOK] Canceling subscription for user: ${profile.user?.email}`);

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

        console.log(`✅ [WEBHOOK] Frontend subscription canceled for user: ${profile.user?.email}`);

        // 🔄 同步取消状态到后端系统
        const backendAccountId = profile.preferences && typeof profile.preferences === 'object' && 'backendAccountId' in profile.preferences 
          ? (profile.preferences as any).backendAccountId 
          : null;
        
        if (backendAccountId) {
          console.log(`🔄 [BACKEND-CANCEL] Syncing cancellation to backend account: ${backendAccountId}`);
          
          try {
            // 将后端账户计划降级为 hobbyist
            const planUpdateResult = await updateBackendAccountPlan({
              accountId: backendAccountId,
              newPlan: "hobbyist"
            });

            if (planUpdateResult.success) {
              console.log(`✅ [BACKEND-CANCEL] Backend plan downgraded to hobbyist for account ${backendAccountId}`);
            } else {
              console.error(`⚠️ [BACKEND-CANCEL] Failed to downgrade backend plan: ${planUpdateResult.error}`);
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
            console.error(`❌ [BACKEND-CANCEL] Backend cancellation sync failed for user ${profile.userId}:`, {
              error: backendError.message || backendError,
              backendAccountId,
              subscriptionId: subscription.id
            });
          }
        } else {
          console.log(`⚠️ [BACKEND-CANCEL] No backend account ID found for user ${profile.userId}, skipping backend sync`);
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
            console.log(`💰 Processing monthly credit renewal for user ${profile.userId}`);
            
            // Grant monthly credits for Pro users (200 credits per month)
            const creditResult = await grantCredits(
              profile.userId,
              200,
              "Monthly Pro subscription renewal credits",
              "stripe",
              invoice.id
            );

            if (!creditResult.success) {
              console.error(`Failed to grant monthly credits to user ${profile.userId}:`, creditResult.error);
            } else {
              console.log(`✅ Monthly credits granted to user ${profile.userId}, new balance: ${creditResult.newBalance}`);
            }

            // 🔄 同步月度续费到后端系统
            const backendAccountId = profile.preferences && typeof profile.preferences === 'object' && 'backendAccountId' in profile.preferences 
              ? (profile.preferences as any).backendAccountId 
              : null;
            
            if (backendAccountId) {
              console.log(`🔄 Syncing monthly renewal to backend account: ${backendAccountId}`);
              
              try {
                // 创建月度credits pack，有效期31天
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
                    status: creditPackResult.success ? "completed" : "partial",
                    gateway: "stripe",
                    gatewayTxnId: invoice.id,
                    subscriptionId: invoice.subscription as string,
                    metadata: {
                      backendAccountId: backendAccountId,
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
            } else {
              console.log(`⚠️ No backend account ID found for user ${profile.userId}, skipping monthly backend sync`);
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
