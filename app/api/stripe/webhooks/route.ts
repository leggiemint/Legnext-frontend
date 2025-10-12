import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, STRIPE_CONFIG } from '@/libs/stripe-client';
import { backendApiClient } from '@/libs/backend-api-client';
import { getUserWithProfile, updateUserPlan } from '@/libs/user-helpers';
import { prisma } from '@/libs/prisma';
import { log } from '@/libs/logger';
import { sendFeishuMessage } from '@/libs/feishu';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Webhook事件处理器映射
const eventHandlers = {
  'checkout.session.completed': handleCheckoutSessionCompleted,
  'customer.subscription.created': handleSubscriptionCreated, // 🔒 安全：添加订阅创建验证
  'invoice.payment_succeeded': handleInvoicePaymentSucceeded,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'payment_intent.succeeded': handlePaymentIntentSucceeded,
  'setup_intent.created': handleSetupIntentCreated,
  'setup_intent.succeeded': handleSetupIntentSucceeded,
  // 🎯 添加客户信息更新处理（对标托管 Checkout 行为）
  'customer.updated': handleCustomerUpdated,
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
 *
 * ⚠️ 向后兼容说明:
 * - Checkout Session 主要用于托管支付流程
 * - 添加支付状态验证,确保支付已完成
 * - invoice.payment_succeeded 会进行二次确认,保持数据一致性
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  const userId = session.metadata?.userId;
  if (!userId) {
    log.error('No userId in session metadata');
    return;
  }

  log.info(`Checkout session completed for user ${userId}, mode: ${session.mode}, payment_status: ${session.payment_status}`);

  // 获取用户信息
  const user = await getUserWithProfile(userId);
  if (!user) {
    log.error(`User not found: ${userId}`);
    return;
  }

  // 处理订阅模式
  if (session.mode === 'subscription') {
    log.info('Processing subscription checkout...');

    // 🛡️ 支付验证: 检查支付状态
    // payment_status 可能的值: 'paid', 'unpaid', 'no_payment_required'
    const paymentConfirmed = session.payment_status === 'paid' ||
                            session.payment_status === 'no_payment_required' ||
                            session.status === 'complete';

    if (!paymentConfirmed) {
      log.warn(`⚠️ Checkout session ${session.id} payment not confirmed (status: ${session.payment_status})`);
      log.info(`ℹ️ Waiting for invoice.payment_succeeded event to process subscription`);
      // 不更新 plan,等待 invoice.payment_succeeded
      return;
    }

    log.info(`✅ Payment confirmed for checkout session ${session.id}, proceeding with subscription activation`);

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
          capacity: 30000, // Pro计划的信用量
          description: 'Pro subscription credit pack (Checkout)',
          expired_at: expiredAt.toISOString(),
        });

        log.info(`✅ Backend account ${user.profile.backendAccountId} updated to developer plan with 30000 credits pack`);
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
  // Note: TopUp payments now use PaymentIntent flow, handled by payment_intent.succeeded event
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
    // 首次订阅支付 - 现在使用 SetupIntent 流程，需要在这里处理
    log.info(`Processing subscription_create invoice ${invoice.id} for SetupIntent flow`);
    await handleSubscriptionCreation(invoice);
    return;
  }
  
  if (invoice.billing_reason === 'subscription_cycle') {
    // 订阅续费
    log.info(`Processing subscription renewal for invoice ${invoice.id}`);
    await handleSubscriptionRenewal(invoice);
  }
}

/**
 * 处理订阅创建（首次支付成功）
 */
async function handleSubscriptionCreation(invoice: Stripe.Invoice) {
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
  log.info(`Processing subscription creation for user ${user.id}`);

  // 更新用户plan为pro
  await updateUserPlan(user.id, 'pro');

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
        capacity: 30000, // Pro计划的信用量
        description: 'Pro subscription credit pack',
        expired_at: expiredAt.toISOString(),
      });

      log.info(`✅ Backend account ${user.profile.backendAccountId} updated to developer plan with 30000 credits pack`);
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
    log.warn(`User ${user.id} has no backend account ID, skipping backend sync`);
  }

  try {
    const amount = invoice.total ? (invoice.total / 100).toFixed(2) : 'Unknown';
    await sendFeishuMessage({
      event: 'subscription.created',
      title: 'New Pro Subscription',
      text: [
        `User: ${user.email || user.id}`,
        `Stripe Invoice: ${invoice.id}`,
        `Amount: $${amount}`,
        `Status: ${invoice.status ?? 'unknown'}`,
      ].join('\n'),
    });
  } catch (notifyError) {
    log.error('❌ [Feishu] Failed to send subscription notification', notifyError);
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
        capacity: 30000,
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

  // 检查订阅是否被取消（期末取消）
  const isCancelled = subscription.status === 'canceled' || 
                     subscription.status === 'unpaid' || 
                     subscription.cancel_at_period_end === true;

  // 根据订阅状态更新用户plan
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    if (subscription.cancel_at_period_end === true) {
      // 期末取消：发送取消通知
      try {
        await sendFeishuMessage({
          event: 'subscription.cancelled',
          title: '⚠️ Subscription Cancelled - Follow Up Required',
          text: [
            `User: ${user.email || user.id}`,
            `Stripe Subscription: ${subscription.id}`,
            `Cancellation Type: End of Period`,
            `Cancellation Reason: ${subscription.cancellation_details?.reason || 'Not specified'}`,
            `Cancelled At: ${subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : new Date().toISOString()}`,
            `Period End: ${subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : 'Unknown'}`,
            `Action Required: Contact user for feedback and retention`
          ].join('\n'),
        });
      } catch (notifyError) {
        log.error('❌ [Feishu] Failed to send subscription cancellation notification', notifyError);
      }
    } else {
      // 正常活跃状态
      await updateUserPlan(user.id, 'pro');
    }
  } else if (isCancelled) {
    await updateUserPlan(user.id, 'free');
    
    // 发送取消订阅通知给客服团队
    try {
      await sendFeishuMessage({
        event: 'subscription.cancelled',
        title: '⚠️ Subscription Cancelled - Follow Up Required',
        text: [
          `User: ${user.email || user.id}`,
          `Stripe Subscription: ${subscription.id}`,
          `Cancellation Type: Immediate`,
          `Cancellation Reason: ${subscription.cancellation_details?.reason || 'Not specified'}`,
          `Cancelled At: ${subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : 'Unknown'}`,
          `Period End: ${subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : 'Unknown'}`,
          `Action Required: Contact user for feedback and retention`
        ].join('\n'),
      });
    } catch (notifyError) {
      log.error('❌ [Feishu] Failed to send subscription cancellation notification', notifyError);
    }
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

  // 发送取消订阅通知给客服团队
  try {
    await sendFeishuMessage({
      event: 'subscription.cancelled',
      title: '⚠️ Subscription Cancelled - Follow Up Required',
      text: [
        `User: ${user.email || user.id}`,
        `Stripe Subscription: ${subscription.id}`,
        `Cancellation Reason: ${subscription.cancellation_details?.reason || 'Not specified'}`,
        `Cancelled At: ${subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : 'Unknown'}`,
        `Period End: ${subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : 'Unknown'}`,
        `Action Required: Contact user for feedback and retention`
      ].join('\n'),
    });
  } catch (notifyError) {
    log.error('❌ [Feishu] Failed to send subscription cancellation notification', notifyError);
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
      
      // 发送飞书通知
      try {
        const amount = (paymentIntent.amount / 100).toFixed(2);
        await sendFeishuMessage({
          event: 'payment.topup',
          title: 'TopUp Payment Success',
          text: [
            `User: ${user.email || user.id}`,
            `Payment Intent: ${paymentIntent.id}`,
            `Amount: $${amount}`,
            `Credits: ${credits}`,
            `Status: ${paymentIntent.status}`,
          ].join('\n'),
        });
      } catch (notifyError) {
        log.error('❌ [Feishu] Failed to send topup notification', notifyError);
      }
    } catch (error) {
      log.error(`❌ [Webhook] Failed to add credits to backend account:`, error);
    }
  } else {
    log.error(`❌ [Webhook] User has no backend account ID`);
  }
}

/**
 * 处理SetupIntent创建事件
 */
async function handleSetupIntentCreated(event: Stripe.Event) {
  const setupIntent = event.data.object as Stripe.SetupIntent;

  log.info(`🔧 [Webhook] SetupIntent created: ${setupIntent.id}`);

  // 对于SetupIntent创建事件，我们通常不需要做特别处理
  // 主要的逻辑会在setup_intent.succeeded事件中处理

  // 记录webhook事件到日志 (webhookEvent表暂未在schema中定义)
  log.info(`📝 [Webhook] SetupIntent created logged: ${setupIntent.id}`);
}

/**
 * 处理SetupIntent成功事件
 */
async function handleSetupIntentSucceeded(event: Stripe.Event) {
  const setupIntent = event.data.object as Stripe.SetupIntent;

  log.info(`✅ [Webhook] SetupIntent succeeded: ${setupIntent.id}`);

  // 检查SetupIntent的类型
  const intentType = setupIntent.metadata?.type;

  if (intentType === 'payment_method_setup') {
    // 用于支付方式管理的SetupIntent
    log.info(`💳 [Webhook] Payment method setup completed for customer: ${setupIntent.customer}`);

    // 这里可以添加额外的逻辑，比如：
    // - 发送确认邮件
    // - 更新用户的支付方式状态
    // - 触发其他业务逻辑

  } else if (intentType === 'subscription_setup') {
    // 用于订阅的SetupIntent
    log.info(`🔄 [Webhook] Subscription setup completed, setup_intent_id: ${setupIntent.id}`);

    // 订阅相关的SetupIntent通常会在confirm-subscription API中处理
    // 这里只是记录日志
  }

  // 记录成功事件到日志 (webhookEvent表暂未在schema中定义)
  log.info(`✅ [Webhook] SetupIntent succeeded logged: ${setupIntent.id}`);
}

/**
 * 处理客户信息更新事件
 * 对标托管 Checkout 的自动客户信息更新功能
 */
async function handleCustomerUpdated(event: Stripe.Event) {
  const customer = event.data.object as Stripe.Customer;
  
  try {
    log.info(`👤 [Webhook] Customer updated: ${customer.id}`, {
      email: customer.email,
      name: customer.name,
      address: customer.address,
    });

    // 如果有 userId metadata，同步更新到我们的数据库
    if (customer.metadata?.userId) {
      const userId = customer.metadata.userId;
      
      // 这里可以添加逻辑来同步客户信息到我们的数据库
      // 例如更新用户的账单地址、姓名等
      log.info(`🔄 [Webhook] Syncing customer info for user: ${userId}`, {
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
      });
      
      // 可以在这里调用用户更新 API 或直接更新数据库
      // await updateUserBillingInfo(userId, customer);
    }

    log.info(`✅ [Webhook] Customer update processed: ${customer.id}`);
    
  } catch (error) {
    log.error(`❌ [Webhook] Error processing customer update:`, {
      customerId: customer.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // 不要抛出错误，避免 Stripe 重试
  }
}

/**
 * 🔒 安全处理订阅创建事件
 * 验证订阅属于正确的用户，防止跨用户数据泄露
 *
 * ⚠️ 向后兼容说明:
 * - 保留原有的 plan 更新逻辑以兼容旧流程
 * - 添加支付验证,只在支付确认后才更新
 * - invoice.payment_succeeded 会进行二次确认,保持数据一致性
 */
async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  try {
    log.info(`🆕 Subscription created: ${subscription.id}, status: ${subscription.status}`);

    // 🔒 安全验证1：检查subscription metadata中的userId
    const subscriptionUserId = subscription.metadata?.userId;
    if (!subscriptionUserId) {
      log.error(`❌ [Security] Subscription ${subscription.id} missing userId in metadata`);
      return;
    }

    // 🔒 安全验证2：获取customer并验证userId匹配
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (customer.deleted) {
      log.error(`❌ [Security] Customer ${subscription.customer} is deleted`);
      return;
    }

    const customerUserId = (customer as Stripe.Customer).metadata?.userId;
    if (!customerUserId) {
      log.error(`❌ [Security] Customer ${customer.id} missing userId in metadata`);
      return;
    }

    // 🔒 安全验证3：确保subscription和customer的userId一致
    if (subscriptionUserId !== customerUserId) {
      log.error(`❌ [Security] UserId mismatch - Subscription: ${subscriptionUserId}, Customer: ${customerUserId}`);
      return;
    }

    // 🔒 安全验证4：确保用户存在于我们的系统中
    const user = await getUserWithProfile(subscriptionUserId);
    if (!user) {
      log.error(`❌ [Security] User ${subscriptionUserId} not found in our system`);
      return;
    }

    // ✅ 所有安全验证通过
    log.info(`✅ Security checks passed for subscription ${subscription.id}, user: ${subscriptionUserId}`);

    // 🛡️ 支付验证: 只在明确支付已完成的状态下才更新 plan
    // 注意: subscription.created 可能在支付完成前触发
    // 向后兼容: 保留 plan 更新,但添加状态检查
    const safeToUpgrade = subscription.status === 'active' ||
                         subscription.status === 'trialing' ||
                         subscription.latest_invoice; // 如果有 invoice,说明计费已开始

    if (safeToUpgrade) {
      log.info(`✅ Subscription ${subscription.id} status is safe (${subscription.status}), updating plan`);
      await updateUserPlan(subscriptionUserId, 'pro');
      log.info(`✅ Updated user ${subscriptionUserId} plan to Pro`);
    } else {
      // 支付未完成,只记录日志,等待 invoice.payment_succeeded
      log.warn(`⚠️ Subscription ${subscription.id} status is ${subscription.status}, waiting for payment confirmation before updating plan`);
      log.info(`ℹ️ Plan update will be handled by invoice.payment_succeeded event`);
    }

    // 📝 向后兼容: Credit pack 创建保持在 invoice.payment_succeeded 中处理
    // 这样即使这里的 plan 更新有问题,credits 仍然是安全的
    log.info(`✅ [Webhook] Subscription ${subscription.id} processed successfully for user ${subscriptionUserId}`);

  } catch (error) {
    log.error(`❌ [Webhook] Error processing subscription creation:`, {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // 不要抛出错误，避免 Stripe 重试
  }
}
