import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, STRIPE_CONFIG } from '@/libs/stripe-client';
import { backendApiClient } from '@/libs/backend-api-client';
import { getUserWithProfile, updateUserPlan } from '@/libs/user-helpers';
import { prisma } from '@/libs/prisma';
import { log } from '@/libs/logger';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Webhook事件处理器映射
const eventHandlers = {
  'checkout.session.completed': handleCheckoutSessionCompleted,
  'invoice.payment_succeeded': handleInvoicePaymentSucceeded,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'payment_intent.succeeded': handlePaymentIntentSucceeded,
};

export async function POST(request: NextRequest) {
  try {
    log.info('🔔 [Webhook] Received webhook event');
    
    // 1. 验证webhook签名 (Stripe安全最佳实践)
    const body = await request.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      log.error('❌ [Webhook] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      // 在开发环境中，如果webhook secret是测试值，跳过签名验证
      if (process.env.NODE_ENV === 'development' && STRIPE_CONFIG.webhookSecret === 'whsec_test_secret') {
        log.warn('⚠️ [Webhook] Development mode: Skipping signature verification');
        event = JSON.parse(body);
      } else {
        event = stripe.webhooks.constructEvent(body, sig, STRIPE_CONFIG.webhookSecret);
      }
    } catch (err) {
      log.error('❌ [Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 2. 立即返回200状态码 (Stripe最佳实践)
    const response = NextResponse.json({ received: true });

    // 3. 异步处理事件 (避免超时)
    setImmediate(async () => {
      try {
        await processWebhookEvent(event);
      } catch (error) {
        log.error('Webhook event processing error:', error);
      }
    });

    return response;

  } catch (error) {
    log.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * 处理webhook事件
 */
async function processWebhookEvent(event: Stripe.Event) {
  log.info(`🔄 [Webhook] Processing event: ${event.type}`);

  const handler = eventHandlers[event.type as keyof typeof eventHandlers];
  if (handler) {
    log.info(`🎯 [Webhook] Calling handler for ${event.type}`);
    try {
      await handler(event);
      log.info(`✅ [Webhook] Handler completed for ${event.type}`);
    } catch (error) {
      log.error(`❌ [Webhook] Handler failed for ${event.type}:`, error);
    }
  } else {
    log.info(`⚠️ [Webhook] Unhandled event type: ${event.type}`);
  }
}

/**
 * 处理结账会话完成
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  const userId = session.metadata?.userId;
  if (!userId) {
    log.error('No userId in session metadata');
    return;
  }

  log.info(`Checkout session completed for user ${userId}, mode: ${session.mode}`);

  // 获取用户信息
  const user = await getUserWithProfile(userId);
  if (!user) {
    log.error(`User not found: ${userId}`);
    return;
  }

  // 处理订阅模式
  if (session.mode === 'subscription') {
    log.info('Processing subscription checkout...');
    
    // 更新用户plan为pro
    await updateUserPlan(userId, 'pro');

    // 如果有backend账户，同步到backend系统
    if (user.profile?.backendAccountId) {
      try {
        log.info(`Syncing subscription to backend for account ${user.profile.backendAccountId}`);
        
        // 1. 更新backend账户计划为developer
        const planResponse = await backendApiClient.updateAccountPlan(user.profile.backendAccountId, 'developer');
        log.info('Plan updated:', planResponse);

        // 2. 为backend账户创建信用包 (订阅用户获得31天有效期的信用包)
        const expiredAt = new Date();
        expiredAt.setDate(expiredAt.getDate() + 31); // 31天有效期

        const creditPackResponse = await backendApiClient.createCreditPack(user.profile.backendAccountId, {
          capacity: 33000, // Pro计划的信用量
          description: 'Pro subscription credit pack',
          expired_at: expiredAt.toISOString(),
        });

        log.info(`✅ Backend account ${user.profile.backendAccountId} updated to developer plan with 33000 credits pack`);
        log.info('Credit pack created:', creditPackResponse);
      } catch (error) {
        log.error('❌ Failed to sync with backend system:', error);
        // 记录详细错误信息以便调试
        if (error instanceof Error) {
          log.error('Error message:', error.message);
          log.error('Error stack:', error.stack);
        }
      }
    } else {
      log.warn(`User ${userId} has no backend account ID, skipping backend sync`);
    }
  }
  // 处理TopUp支付模式
  else if (session.mode === 'payment' && session.metadata?.type === 'topup') {
    log.info('Processing TopUp checkout...');
    
    const credits = parseInt(session.metadata?.credits || '0');
    if (!credits) {
      log.error('❌ No credits found in session metadata for TopUp');
      return;
    }

    log.info(`💰 TopUp payment completed for user ${userId}, credits: ${credits}`);

    // 添加credits到用户账户
    if (user.profile?.backendAccountId) {
      try {
        log.info(`🔄 Adding ${credits} credits to backend account ${user.profile.backendAccountId}`);
        
        const expiredAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1年后过期
        
        await backendApiClient.createCreditPack(
          user.profile.backendAccountId,
          {
            capacity: credits,
            description: `TopUp: ${credits} credits`,
            expired_at: expiredAt.toISOString()
          }
        );
        
        log.info(`✅ Successfully added ${credits} credits to user account`);
      } catch (error) {
        log.error(`❌ Failed to add credits to backend account:`, error);
      }
    } else {
      log.error(`❌ User has no backend account ID`);
    }
  }
  else {
    log.info(`ℹ️ Checkout session mode '${session.mode}' not handled, skipping`);
  }
}

/**
 * 处理发票支付成功
 */
async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  log.info(`Invoice payment succeeded: ${invoice.id}, billing_reason: ${invoice.billing_reason}`);
  
  // 区分订阅类型 (2024最佳实践)
  if (invoice.billing_reason === 'subscription_create') {
    // 首次订阅支付，已在checkout.session.completed处理
    // 但Stripe仍会发送invoice.payment_succeeded事件，我们记录但不重复处理
    log.info(`Skipping subscription_create invoice ${invoice.id} - already handled in checkout.session.completed`);
    return;
  }
  
  if (invoice.billing_reason === 'subscription_cycle') {
    // 订阅续费
    log.info(`Processing subscription renewal for invoice ${invoice.id}`);
    await handleSubscriptionRenewal(invoice);
  }
}

/**
 * 处理订阅续费
 */
async function handleSubscriptionRenewal(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // 通过Stripe客户ID查找用户
  const paymentCustomer = await prisma.paymentCustomer.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!paymentCustomer) {
    log.error(`Payment customer not found for Stripe customer: ${customerId}`);
    return;
  }

  // 通过userId获取用户信息
  const user = await getUserWithProfile(paymentCustomer.userId);
  if (!user) {
    log.error(`User not found for userId: ${paymentCustomer.userId}`);
    return;
  }
  log.info(`Subscription renewal for user ${user.id}`);

  // 确保用户plan为pro
  await updateUserPlan(user.id, 'pro');

  // 为backend账户添加新的信用包
  if (user.profile?.backendAccountId) {
    try {
      log.info(`Creating renewal credit pack for account ${user.profile.backendAccountId}`);
      
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + 31); // 31天有效期

      const creditPackResponse = await backendApiClient.createCreditPack(user.profile.backendAccountId, {
        capacity: 33000,
        description: 'Pro subscription renewal credit pack',
        expired_at: expiredAt.toISOString(),
      });

      log.info(`✅ Credit pack added for subscription renewal: user ${user.id}`);
      log.info('Renewal credit pack created:', creditPackResponse);
    } catch (error) {
      log.error('❌ Failed to create renewal credit pack:', error);
      if (error instanceof Error) {
        log.error('Error message:', error.message);
        log.error('Error stack:', error.stack);
      }
    }
  } else {
    log.warn(`User ${user.id} has no backend account ID, skipping renewal credit pack creation`);
  }
}

/**
 * 处理发票支付失败
 */
async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const customerId = invoice.customer as string;
  
  log.info(`Invoice payment failed for customer: ${customerId}`);
  
  // 可以在这里添加通知用户、暂停服务等逻辑
  // 但不立即降级用户plan，因为Stripe有重试机制
}

/**
 * 处理订阅更新
 */
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
  
  // 通过Stripe客户ID查找用户
  const paymentCustomer = await prisma.paymentCustomer.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!paymentCustomer) {
    log.error(`Payment customer not found for Stripe customer: ${customerId}`);
    return;
  }

  // 通过userId获取用户信息
  const user = await getUserWithProfile(paymentCustomer.userId);
  if (!user) {
    log.error(`User not found for userId: ${paymentCustomer.userId}`);
    return;
  }

  log.info(`Subscription updated for user ${user.id}: ${subscription.status}`);

  // 根据订阅状态更新用户plan
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await updateUserPlan(user.id, 'pro');
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await updateUserPlan(user.id, 'free');
  }
}

/**
 * 处理订阅删除
 */
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
  
  // 通过Stripe客户ID查找用户
  const paymentCustomer = await prisma.paymentCustomer.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!paymentCustomer) {
    log.error(`Payment customer not found for Stripe customer: ${customerId}`);
    return;
  }

  // 通过userId获取用户信息
  const user = await getUserWithProfile(paymentCustomer.userId);
  if (!user) {
    log.error(`User not found for userId: ${paymentCustomer.userId}`);
    return;
  }

  log.info(`Subscription deleted for user ${user.id}`);

  // 降级用户plan
  await updateUserPlan(user.id, 'free');

  // 同步到backend系统
  if (user.profile?.backendAccountId) {
    try {
      await backendApiClient.updateAccountPlan(
        user.profile.backendAccountId,
        'hobbyist'
      );
      log.info(`Backend account downgraded to hobbyist plan`);
    } catch (error) {
      log.error('Failed to downgrade backend account:', error);
    }
  }
}

/**
 * 处理TopUp支付成功
 */
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  // 只处理TopUp相关的支付
  if (paymentIntent.metadata?.type !== 'topup') {
    log.info('ℹ️ [Webhook] Payment intent not for topup, skipping');
    return;
  }

  const userId = paymentIntent.metadata?.userId;
  const credits = parseInt(paymentIntent.metadata?.credits || '0');

  if (!userId || !credits) {
    log.error('❌ [Webhook] Missing userId or credits in payment intent metadata');
    return;
  }

  log.info(`💰 [Webhook] TopUp payment succeeded for user ${userId}, credits: ${credits}`);

  // 获取用户信息
  const user = await getUserWithProfile(userId);
  if (!user) {
    log.error(`❌ [Webhook] User not found: ${userId}`);
    return;
  }

  // 添加credits到用户账户
  if (user.profile?.backendAccountId) {
    try {
      log.info(`🔄 [Webhook] Adding ${credits} credits to backend account ${user.profile.backendAccountId}`);
      
      // 调用backend API添加credits pack
      const { backendApiClient } = await import('@/libs/backend-api-client');
      
      await backendApiClient.createCreditPack(
        user.profile.backendAccountId,
        {
          capacity: credits,
          description: `TopUp: ${credits} credits`,
          expired_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1年后过期
        }
      );
      
      log.info(`✅ [Webhook] Successfully added ${credits} credits to user account`);
    } catch (error) {
      log.error(`❌ [Webhook] Failed to add credits to backend account:`, error);
    }
  } else {
    log.error(`❌ [Webhook] User has no backend account ID`);
  }
}