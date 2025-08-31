import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { getPaymentConfig } from "@/config";
import { IdempotencyManager, generateIdempotencyKey } from "@/libs/idempotency/idempotency-manager";

// Square事件类型映射
export const SQUARE_EVENT_TYPES = {
  // 支付相关事件
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_UPDATED: 'payment.updated',

  // 订阅相关事件（在支付链接方式下可能不完整）
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',

  // 发票相关事件
  INVOICE_PAYMENT_MADE: 'invoice.payment_made',

  // 其他事件
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated'
} as const;

export type SquareEventType = typeof SQUARE_EVENT_TYPES[keyof typeof SQUARE_EVENT_TYPES];

// 事件处理器接口
interface SquareEventHandler {
  eventType: SquareEventType;
  handler: (event: any, eventId: string) => Promise<void>;
}

// 事件处理器映射
const eventHandlers: Record<SquareEventType, (event: any, eventId: string) => Promise<void>> = {
  [SQUARE_EVENT_TYPES.PAYMENT_COMPLETED]: handlePaymentCompleted,
  [SQUARE_EVENT_TYPES.PAYMENT_FAILED]: handlePaymentFailed,
  [SQUARE_EVENT_TYPES.PAYMENT_UPDATED]: handlePaymentUpdated,
  [SQUARE_EVENT_TYPES.SUBSCRIPTION_CREATED]: handleSubscriptionCreated,
  [SQUARE_EVENT_TYPES.SUBSCRIPTION_UPDATED]: handleSubscriptionUpdated,
  [SQUARE_EVENT_TYPES.SUBSCRIPTION_CANCELED]: handleSubscriptionCanceled,
  [SQUARE_EVENT_TYPES.INVOICE_PAYMENT_MADE]: handleInvoicePaymentMade,
  [SQUARE_EVENT_TYPES.ORDER_CREATED]: handleOrderCreated,
  [SQUARE_EVENT_TYPES.ORDER_UPDATED]: handleOrderUpdated
};

// 幂等性包装函数
async function withIdempotency<T>(
  operation: () => Promise<T>,
  key: string,
  resource: string,
  action: string,
  ttlHours: number = 24
): Promise<T> {
  const manager = IdempotencyManager.getInstance();

  // 检查幂等性
  const existingRecord = await manager.checkIdempotency(key, resource, action);
  if (existingRecord) {
    if (existingRecord.status === 'completed') {
      console.log(`⏭️ Operation already completed (idempotent): ${key}`);
      return existingRecord.result;
    } else if (existingRecord.status === 'processing') {
      console.log(`⏳ Operation already in progress: ${key}`);
      throw new Error('Operation already in progress');
    }
  }

  // 开始处理
  await manager.startProcessing(key, resource, action, ttlHours);

  try {
    // 执行操作
    const result = await operation();

    // 完成处理
    await manager.completeProcessing(key, resource, action, result);

    return result;
  } catch (error) {
    // 记录失败
    await manager.failProcessing(key, resource, action, error.message);
    throw error;
  }
}

// 主事件处理器
export async function processSquareEvent(event: any): Promise<void> {
  const startTime = Date.now();
  const eventType = event.type as SquareEventType;
  const eventId = event.event_id;

  try {
    console.log('🎯 Processing Square event:', {
      eventType,
      eventId,
      merchantId: event.merchant_id,
      createdAt: event.created_at,
      timestamp: new Date().toISOString()
    });

    // 检查事件类型是否支持
    if (!eventHandlers[eventType]) {
      console.warn(`⚠️ Unsupported Square event type: ${eventType}`, {
        eventId,
        supportedTypes: Object.keys(eventHandlers)
      });
      return;
    }

    // 连接数据库
    await connectMongo();

    // 使用幂等性包装处理事件
    const idempotencyKey = generateIdempotencyKey('square', eventType.replace('.', '_'), eventId);
    await withIdempotency(
      () => eventHandlers[eventType](event, eventId),
      idempotencyKey,
      'square',
      eventType.replace('.', '_'),
      24
    );

    const duration = Date.now() - startTime;
    console.log(`✅ Square event processed successfully:`, {
      eventType,
      eventId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Square event processing failed:`, {
      eventType,
      eventId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    // 记录失败事件
    try {
      await recordFailedEvent(event, error);
    } catch (recordError) {
      console.error('❌ Failed to record error event:', recordError);
    }

    throw error;
  }
}

// 处理支付完成事件
async function handlePaymentCompleted(event: any, eventId: string): Promise<void> {
  const payment = event.data.object;
  const { amount_money, buyer_email_address, receipt_number, order_id } = payment;

  console.log('💳 Processing payment completed:', {
    paymentId: payment.id,
    amount: amount_money?.amount,
    currency: amount_money?.currency,
    email: buyer_email_address,
    orderId: order_id,
    eventId
  });

  if (!buyer_email_address) {
    console.warn('⚠️ Payment completed but no buyer email found');
    return;
  }

  // 查找用户
  const user = await findUserByEmail(buyer_email_address);
  if (!user) {
    console.warn(`⚠️ User not found for email: ${buyer_email_address}`);
    return;
  }

  // 计算金额和积分
  const amountInCents = parseInt(amount_money?.amount || "0");
  const amountInDollars = amountInCents / 100;

  const squareConfig = getPaymentConfig();
  const plan = squareConfig.plans.find(p => p.price === amountInDollars) ||
               squareConfig.plans.find(p => p.name === "Pro");

  if (plan) {
    await updateUserAfterPayment(
      user._id.toString(),
      plan.name.toLowerCase(),
      plan.credits
    );

    // 记录成功事件
    await recordProcessedEvent(user._id, eventId, event.type, {
      paymentId: payment.id,
      orderId: order_id,
      receiptNumber: receipt_number,
      amount: amountInCents,
      currency: amount_money?.currency,
      planName: plan.name,
      creditsGranted: plan.credits,
      source: 'square_payment_completed'
    });

    console.log(`✅ Updated user ${user.email}: plan=${plan.name}, credits=+${plan.credits}`);
  } else {
    console.warn(`⚠️ No matching plan found for amount: $${amountInDollars}`);
  }
}

// 处理支付失败事件
async function handlePaymentFailed(event: any, eventId: string): Promise<void> {
  const payment = event.data.object;
  console.log('❌ Processing payment failed:', {
    paymentId: payment.id,
    amount: payment.amount_money?.amount,
    email: payment.buyer_email_address,
    reason: payment.processing_fee || "Unknown",
    eventId
  });

  // 这里可以添加失败处理逻辑，比如通知用户或记录失败统计
  if (payment.buyer_email_address) {
    const user = await findUserByEmail(payment.buyer_email_address);
    if (user) {
      await recordProcessedEvent(user._id, eventId, event.type, {
        paymentId: payment.id,
        amount: payment.amount_money?.amount,
        reason: payment.processing_fee || "Unknown",
        source: 'square_payment_failed'
      });
    }
  }
}

// 处理支付更新事件
async function handlePaymentUpdated(event: any, eventId: string): Promise<void> {
  const payment = event.data.object;
  console.log('🔄 Processing payment updated:', {
    paymentId: payment.id,
    status: payment.status,
    eventId
  });

  // 记录状态更新事件
  if (payment.buyer_email_address) {
    const user = await findUserByEmail(payment.buyer_email_address);
    if (user) {
      await recordProcessedEvent(user._id, eventId, event.type, {
        paymentId: payment.id,
        status: payment.status,
        source: 'square_payment_updated'
      });
    }
  }
}

// 处理订阅创建事件
async function handleSubscriptionCreated(event: any, eventId: string): Promise<void> {
  const subscription = event.data.object;
  console.log('🆕 Processing subscription created:', {
    subscriptionId: subscription.id || 'N/A',
    customerId: subscription.customer_id || 'N/A',
    eventId,
    note: 'Using payment link approach - limited subscription data'
  });

  // 在支付链接方式下，订阅创建事件可能不完整
  // 这里主要用于记录和监控目的
  if (subscription.customer_id) {
    const user = await findUserBySquareCustomerId(subscription.customer_id);
    if (user) {
      await recordProcessedEvent(user._id, eventId, event.type, {
        subscriptionId: subscription.id,
        customerId: subscription.customer_id,
        status: subscription.status,
        source: 'square_subscription_created',
        note: 'Payment link approach - subscription data may be limited'
      });
    }
  }
}

// 处理订阅更新事件
async function handleSubscriptionUpdated(event: any, eventId: string): Promise<void> {
  const subscription = event.data.object;
  console.log('🔄 Processing subscription updated:', {
    subscriptionId: subscription.id || 'N/A',
    status: subscription.status,
    eventId
  });

  if (subscription.customer_id) {
    const user = await findUserBySquareCustomerId(subscription.customer_id);
    if (user) {
      await recordProcessedEvent(user._id, eventId, event.type, {
        subscriptionId: subscription.id,
        customerId: subscription.customer_id,
        status: subscription.status,
        source: 'square_subscription_updated'
      });
    }
  }
}

// 处理订阅取消事件
async function handleSubscriptionCanceled(event: any, eventId: string): Promise<void> {
  const subscription = event.data.object;
  console.log('❌ Processing subscription canceled:', {
    subscriptionId: subscription.id || 'N/A',
    customerId: subscription.customer_id || 'N/A',
    canceledDate: subscription.canceled_date,
    eventId
  });

  if (subscription.customer_id) {
    const user = await findUserBySquareCustomerId(subscription.customer_id);
    if (user) {
      await recordProcessedEvent(user._id, eventId, event.type, {
        subscriptionId: subscription.id,
        customerId: subscription.customer_id,
        canceledDate: subscription.canceled_date,
        source: 'square_subscription_canceled'
      });
    }
  }
}

// 处理发票支付事件
async function handleInvoicePaymentMade(event: any, eventId: string): Promise<void> {
  const invoice = event.data.object;
  console.log('💰 Processing invoice payment made:', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription_id,
    amount: invoice.amount_money?.amount,
    eventId
  });

  if (invoice.customer_id) {
    const user = await findUserBySquareCustomerId(invoice.customer_id);
    if (user) {
      // 这里可以处理续费逻辑
      await recordProcessedEvent(user._id, eventId, event.type, {
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription_id,
        amount: invoice.amount_money?.amount,
        currency: invoice.amount_money?.currency,
        source: 'square_invoice_payment_made'
      });
    }
  }
}

// 处理订单创建事件
async function handleOrderCreated(event: any, eventId: string): Promise<void> {
  const order = event.data.object;
  console.log('📦 Processing order created:', {
    orderId: order.id,
    total: order.total_money?.amount,
    eventId
  });

  // 记录订单事件（用于审计和监控）
  await recordGlobalEvent(eventId, event.type, {
    orderId: order.id,
    total: order.total_money?.amount,
    currency: order.total_money?.currency,
    source: 'square_order_created'
  });
}

// 处理订单更新事件
async function handleOrderUpdated(event: any, eventId: string): Promise<void> {
  const order = event.data.object;
  console.log('🔄 Processing order updated:', {
    orderId: order.id,
    state: order.state,
    eventId
  });

  // 记录订单更新事件
  await recordGlobalEvent(eventId, event.type, {
    orderId: order.id,
    state: order.state,
    source: 'square_order_updated'
  });
}

// 辅助函数

async function findUserByEmail(email: string) {
  try {
    return await User.findOne({ email });
  } catch (error) {
    console.error('❌ Error finding user by email:', error);
    return null;
  }
}

async function findUserBySquareCustomerId(squareCustomerId: string) {
  try {
    return await User.findOne({ squareCustomerId });
  } catch (error) {
    console.error('❌ Error finding user by Square customer ID:', error);
    return null;
  }
}

async function checkEventProcessed(userId: string, eventId: string): Promise<boolean> {
  try {
    const user = await User.findById(userId);
    const existingEvent = user?.webhookEvents?.find(
      (event: any) => event.eventId === eventId
    );
    return existingEvent && existingEvent.processed;
  } catch (error) {
    console.error('❌ Error checking event processed:', error);
    return false;
  }
}

async function recordProcessedEvent(userId: string, eventId: string, eventType: string, metadata: any): Promise<void> {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        webhookEvents: {
          eventId,
          eventType,
          processed: true,
          processedAt: new Date(),
          metadata
        }
      }
    });
  } catch (error) {
    console.error('❌ Error recording processed event:', error);
    throw error;
  }
}

async function recordFailedEvent(event: any, error: any): Promise<void> {
  try {
    // 记录到全局错误日志（可以考虑创建一个专门的错误日志集合）
    console.error('📝 Recording failed Square event:', {
      eventId: event.event_id,
      eventType: event.type,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } catch (recordError) {
    console.error('❌ Failed to record error event:', recordError);
  }
}

async function recordGlobalEvent(eventId: string, eventType: string, metadata: any): Promise<void> {
  try {
    // 这里可以记录到全局事件日志
    console.log('📝 Recording global Square event:', {
      eventId,
      eventType,
      metadata,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error recording global event:', error);
  }
}

async function updateUserAfterPayment(userId: string, planName: string, creditsToAdd: number): Promise<void> {
  try {
    const updateData: any = {
      plan: planName,
      hasAccess: true,
      subscriptionStatus: "active",
      $inc: {
        "credits.balance": creditsToAdd,
        "credits.totalEarned": creditsToAdd
      },
      "credits.lastCreditGrant": {
        date: new Date(),
        amount: creditsToAdd,
        reason: "square_payment"
      }
    };

    // 如果是pro计划，设置订阅开始日期
    if (planName === "pro") {
      updateData.subscriptionStartDate = new Date();
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found`);
    }

    console.log(`✅ Updated user ${updatedUser.email}:`, {
      plan: planName,
      creditsAdded: creditsToAdd,
      newBalance: updatedUser.credits?.balance,
      hasAccess: true,
      subscriptionStatus: "active"
    });

  } catch (error) {
    console.error('❌ Error updating user after payment:', error);
    throw error;
  }
}

// 导出支持的事件类型
export { SQUARE_EVENT_TYPES as SUPPORTED_SQUARE_EVENTS };
