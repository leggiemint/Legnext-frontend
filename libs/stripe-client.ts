import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
  appInfo: {
    name: 'Legnext API Platform',
    version: '1.0.0',
  },
});

// Stripe配置
export const STRIPE_CONFIG = {
  // 产品价格ID (从Stripe Dashboard获取)
  prices: {
    pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1S5uw4KyeXh3bz3dRuK7bAcv',
  },
  
  // Webhook签名密钥
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // 支付成功和取消页面
  urls: {
    success: process.env.NEXTAUTH_URL + '/subscription/success?session_id={CHECKOUT_SESSION_ID}',
    cancel: process.env.NEXTAUTH_URL + '/subscription/cancel',
  },
};

export interface CreateCheckoutSessionParams {
  customerId?: string;
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}

// 创建TopUp结账会话的参数接口
export interface CreateTopUpCheckoutSessionParams {
  customerId: string;
  amount: number; // 金额（cents）
  credits: number; // 积分数量
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface SubscriptionInfo {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  ended_at: number | null;
  price: {
    id: string;
    unit_amount: number;
    currency: string;
    recurring: {
      interval: string;
      interval_count: number;
    };
  };
  customer: string;
  latest_invoice?: string;
}

/**
 * 创建或获取Stripe客户
 */
export async function getOrCreateStripeCustomer(
  userId: string, 
  email: string, 
  name?: string
): Promise<string> {
  try {
    // 🔒 安全修复：先通过userId metadata查找，确保多租户隔离
    const existingCustomersByUserId = await stripe.customers.list({
      limit: 100, // 增加限制以确保找到正确的客户
    });

    // 在客户列表中查找匹配的userId
    const existingCustomer = existingCustomersByUserId.data.find(
      customer => customer.metadata?.userId === userId
    );

    if (existingCustomer) {
      // 🔒 验证email匹配，防止数据泄露
      if (existingCustomer.email !== email) {
        console.warn(`⚠️ Customer ${existingCustomer.id} has userId ${userId} but different email. Updating email.`);
        await stripe.customers.update(existingCustomer.id, {
          email,
          name,
        });
      }
      return existingCustomer.id;
    }

    // 🔒 双重检查：通过email查找但验证userId不冲突
    const existingCustomersByEmail = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomersByEmail.data.length > 0) {
      const customer = existingCustomersByEmail.data[0];
      
      // 🔒 安全检查：如果email存在但userId不同，这是一个安全问题
      if (customer.metadata?.userId && customer.metadata.userId !== userId) {
        throw new Error(`Security violation: Email ${email} is already associated with a different user`);
      }
      
      // 如果email存在但没有userId，更新metadata
      await stripe.customers.update(customer.id, {
        metadata: { userId },
        name,
      });
      return customer.id;
    }

    // 创建新客户
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });

    console.log(`✅ Created new Stripe customer: ${customer.id} for user: ${userId}`);
    return customer.id;
  } catch (error) {
    console.error('Error getting or creating Stripe customer:', error);
    throw error;
  }
}

/**
 * 创建订阅结账会话 (2024最佳实践)
 */
export async function createSubscriptionCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  try {
    console.log('🔧 Creating Stripe checkout session with params:', {
      mode: 'subscription',
      customer: params.customerId,
      priceId: params.priceId,
      userId: params.userId,
      userEmail: params.userEmail,
      successUrl: params.successUrl || STRIPE_CONFIG.urls.success,
      cancelUrl: params.cancelUrl || STRIPE_CONFIG.urls.cancel,
    });

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription' as const,
      customer: params.customerId,
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl || STRIPE_CONFIG.urls.success,
      cancel_url: params.cancelUrl || STRIPE_CONFIG.urls.cancel,
      metadata: {
        userId: params.userId,
      },
      customer_update: {
        address: 'auto' as const,
        name: 'auto' as const,
      },
      // 限制支付方式为卡片和数字钱包
      payment_method_types: ['card'],
      // 自动税收计算
      automatic_tax: {
        enabled: true,
      },
    };

    console.log('📋 Stripe session config:', JSON.stringify(sessionConfig, null, 2));

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Stripe checkout session created successfully:', {
      id: session.id,
      url: session.url,
      mode: session.mode,
    });

    return session;
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    throw error;
  }
}

/**
 * 创建TopUp结账会话（一次性支付）
 */
export async function createTopUpCheckoutSession(
  params: CreateTopUpCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  try {
    console.log('💰 Creating Stripe top-up checkout session with params:', {
      mode: 'payment',
      customer: params.customerId,
      amount: params.amount,
      credits: params.credits,
      userId: params.userId,
      userEmail: params.userEmail,
      successUrl: params.successUrl || STRIPE_CONFIG.urls.success,
      cancelUrl: params.cancelUrl || STRIPE_CONFIG.urls.cancel,
    });

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment' as const,
      customer: params.customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${params.credits} Credits Top-Up`,
              description: `Add ${params.credits} credits to your account`,
            },
            unit_amount: params.amount, // 金额（cents）
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl || STRIPE_CONFIG.urls.success,
      cancel_url: params.cancelUrl || STRIPE_CONFIG.urls.cancel,
      metadata: {
        userId: params.userId,
        credits: params.credits.toString(),
        type: 'topup',
      },
      customer_update: {
        address: 'auto' as const,
        name: 'auto' as const,
      },
      // 限制支付方式为卡片
      payment_method_types: ['card'],
      // 自动税收计算
      automatic_tax: {
        enabled: true,
      },
    };

    console.log('📋 Stripe top-up session config:', JSON.stringify(sessionConfig, null, 2));

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Stripe top-up checkout session created successfully:', {
      id: session.id,
      url: session.url,
      mode: session.mode,
    });

    return session;
  } catch (error) {
    console.error('❌ Error creating top-up checkout session:', error);
    throw error;
  }
}

/**
 * 获取订阅信息
 */
export async function getSubscriptionInfo(subscriptionId: string): Promise<SubscriptionInfo | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'items.data.price'],
    });

    const price = subscription.items.data[0]?.price;

    return {
      id: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at,
      ended_at: subscription.ended_at,
      customer: subscription.customer as string,
      latest_invoice: subscription.latest_invoice as string,
      price: {
        id: price?.id || '',
        unit_amount: price?.unit_amount || 0,
        currency: price?.currency || 'usd',
        recurring: {
          interval: price?.recurring?.interval || 'month',
          interval_count: price?.recurring?.interval_count || 1,
        },
      },
    };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return null;
  }
}

/**
 * 取消订阅 (期末取消)
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * 立即取消订阅
 */
export async function cancelSubscriptionImmediately(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription immediately:', error);
    throw error;
  }
}

/**
 * 恢复订阅
 */
export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return subscription;
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
}

/**
 * 获取客户的活跃订阅
 */
export async function getActiveSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    });

    return subscriptions.data;
  } catch (error) {
    console.error('Error getting active subscriptions:', error);
    return [];
  }
}

/**
 * 获取客户的所有发票
 */
export async function getCustomerInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data;
  } catch (error) {
    console.error('Error getting customer invoices:', error);
    return [];
  }
}

/**
 * 获取发票详情
 */
export async function getInvoiceDetails(invoiceId: string): Promise<Stripe.Invoice | null> {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice;
  } catch (error) {
    console.error('Error getting invoice details:', error);
    return null;
  }
}