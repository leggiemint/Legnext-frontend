import { SquareClient, SquareEnvironment } from "square";
import crypto from "crypto";
import { prisma } from "@/libs/prisma";

// 修复后的 Square 订阅实现
const getSquareClient = () => {
  const clientConfig = {
    environment: process.env.SQUARE_ENVIRONMENT === 'production' 
      ? SquareEnvironment.Production 
      : SquareEnvironment.Sandbox,
    accessToken: process.env.SQUARE_ACCESS_TOKEN!,
    timeout: 10000,
  };

  return new SquareClient(clientConfig);
};

// 创建真正的 Square 订阅（修复版）
export const createRealSquareSubscription = async (params: {
  customerId?: string;
  planId: string;
  email: string;
  userId: string;
  name?: string;
}) => {
  const client = getSquareClient();
  
  try {
    console.log('🔄 Creating real Square subscription:', params);

    // 1. 创建或获取客户
    const squareCustomerId = await createOrGetSquareCustomer({
      email: params.email,
      name: params.name,
      userId: params.userId
    });

    // 2. 获取计划变体
    const planVariation = await getPlanVariation(params.planId);
    if (!planVariation) {
      throw new Error(`Plan variation not found for: ${params.planId}`);
    }

    // 3. 创建订阅
    const response = await client.subscriptions.create({
      idempotencyKey: crypto.randomUUID(),
      locationId: process.env.SQUARE_LOCATION_ID!,
      planVariationId: planVariation.catalogObjectId,
      customerId: squareCustomerId,
      startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      chargedThroughDate: undefined,
      invoiceRequestMethod: 'EMAIL',
      cardId: undefined, // 客户稍后提供支付方式
      timezone: 'America/New_York',
    });

    if (!response.subscription) {
      throw new Error('Failed to create Square subscription');
    }

    const subscription = response.subscription;

    // 4. 保存到数据库
    const dbSubscription = await prisma.subscription.create({
      data: {
        userId: params.userId,
        name: 'Pro Plan',
        status: subscription.status?.toLowerCase() || 'active',
        gateway: 'square',
        gatewaySubscriptionId: subscription.id!,
        gatewayCustomerId: squareCustomerId,
        gatewayPlanId: planVariation.catalogObjectId,
        subscriptionStart: new Date(subscription.startDate!),
        subscriptionEnd: subscription.chargedThroughDate ? new Date(subscription.chargedThroughDate) : null,
        metadata: {
          squareSubscriptionId: subscription.id,
          squareCustomerId: squareCustomerId,
          planVariationId: planVariation.catalogObjectId,
          createdAt: new Date().toISOString()
        }
      }
    });

    console.log('✅ Real Square subscription created:', {
      subscriptionId: subscription.id,
      status: subscription.status,
      userId: params.userId
    });

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: squareCustomerId,
      dbSubscription
    };

  } catch (error) {
    console.error('❌ Failed to create real Square subscription:', error);
    throw error;
  }
};

// 创建或获取 Square 客户（修复版）
export const createOrGetSquareCustomer = async (userData: {
  email: string;
  name?: string;
  userId: string;
}): Promise<string> => {
  const client = getSquareClient();
  
  try {
    // 1. 检查本地数据库是否已有客户记录
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        userId: userData.userId,
        gateway: 'square'
      }
    });

    if (existingCustomer?.squareCustomerId) {
      console.log('✅ Found existing Square customer:', existingCustomer.squareCustomerId);
      return existingCustomer.squareCustomerId;
    }

    // 2. 在 Square 中搜索现有客户
    const searchResponse = await client.customers.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: userData.email
          }
        }
      }
    });

    if (searchResponse.customers && searchResponse.customers.length > 0) {
      const squareCustomer = searchResponse.customers[0];
      console.log('✅ Found existing Square customer by email:', squareCustomer.id);

      // 保存到本地数据库
      await prisma.customer.upsert({
        where: {
          userId_gateway: {
            userId: userData.userId,
            gateway: 'square'
          }
        },
        create: {
          userId: userData.userId,
          gateway: 'square',
          squareCustomerId: squareCustomer.id!,
          email: userData.email,
          metadata: {
            squareCustomerId: squareCustomer.id,
            createdAt: new Date().toISOString()
          }
        },
        update: {
          squareCustomerId: squareCustomer.id!,
          email: userData.email,
          metadata: {
            squareCustomerId: squareCustomer.id,
            updatedAt: new Date().toISOString()
          }
        }
      });

      return squareCustomer.id!;
    }

    // 3. 创建新客户
    const createResponse = await client.customers.createCustomer({
      idempotencyKey: crypto.randomUUID(),
      givenName: userData.name?.split(' ')[0] || userData.email.split('@')[0],
      familyName: userData.name?.split(' ')[1] || '',
      emailAddress: userData.email,
      note: `User ID: ${userData.userId}`
    });

    if (!createResponse.customer) {
      throw new Error('Failed to create Square customer');
    }

    const squareCustomer = createResponse.customer;
    console.log('✅ Created new Square customer:', squareCustomer.id);

    // 4. 保存到本地数据库
    await prisma.customer.create({
      data: {
        userId: userData.userId,
        gateway: 'square',
        squareCustomerId: squareCustomer.id!,
        email: userData.email,
        metadata: {
          squareCustomerId: squareCustomer.id,
          createdAt: new Date().toISOString()
        }
      }
    });

    return squareCustomer.id!;

  } catch (error) {
    console.error('❌ Failed to create or get Square customer:', error);
    throw error;
  }
};

// 获取计划变体
async function getPlanVariation(planId: string) {
  // 根据 planId 查找对应的计划变体
  const planVariation = await prisma.squarePlanVariation.findFirst({
    where: {
      plan: {
        name: planId === 'pro-monthly-subscription' ? 'Pro Plan' : 'Free Plan'
      },
      cadence: 'MONTHLY',
      isActive: true
    }
  });

  return planVariation;
}

// 取消 Square 订阅（修复版）
export const cancelSquareSubscriptionFixed = async (subscriptionId: string) => {
  const client = getSquareClient();
  
  try {
    console.log('🔴 Canceling Square subscription:', subscriptionId);

    // 1. 在 Square 中取消订阅
    const response = await client.subscriptions.cancelSubscription({
      subscriptionId: subscriptionId,
      canceledDate: new Date().toISOString().split('T')[0]
    });

    if (!response.subscription) {
      throw new Error('Failed to cancel Square subscription');
    }

    // 2. 更新本地数据库
    await prisma.subscription.updateMany({
      where: {
        gatewaySubscriptionId: subscriptionId,
        gateway: 'square'
      },
      data: {
        status: 'canceled',
        subscriptionEnd: new Date(),
        metadata: {
          canceledAt: new Date().toISOString(),
          canceledBy: 'user'
        }
      }
    });

    console.log('✅ Square subscription canceled:', subscriptionId);
    return true;

  } catch (error) {
    console.error('❌ Failed to cancel Square subscription:', error);
    throw error;
  }
};

// 暂停 Square 订阅
export const pauseSquareSubscription = async (subscriptionId: string) => {
  const client = getSquareClient();
  
  try {
    console.log('⏸️ Pausing Square subscription:', subscriptionId);

    const response = await client.subscriptions.pauseSubscription({
      subscriptionId: subscriptionId,
      pauseEffectiveDate: new Date().toISOString().split('T')[0],
      pauseCycleDays: 0, // 立即暂停
      resumeEffectiveDate: undefined // 手动恢复
    });

    if (!response.subscription) {
      throw new Error('Failed to pause Square subscription');
    }

    // 更新本地数据库
    await prisma.subscription.updateMany({
      where: {
        gatewaySubscriptionId: subscriptionId,
        gateway: 'square'
      },
      data: {
        status: 'paused',
        metadata: {
          pausedAt: new Date().toISOString(),
          pausedBy: 'user'
        }
      }
    });

    console.log('✅ Square subscription paused:', subscriptionId);
    return true;

  } catch (error) {
    console.error('❌ Failed to pause Square subscription:', error);
    throw error;
  }
};

// 恢复 Square 订阅
export const resumeSquareSubscription = async (subscriptionId: string) => {
  const client = getSquareClient();
  
  try {
    console.log('▶️ Resuming Square subscription:', subscriptionId);

    const response = await client.subscriptions.resumeSubscription({
      subscriptionId: subscriptionId,
      resumeEffectiveDate: new Date().toISOString().split('T')[0]
    });

    if (!response.subscription) {
      throw new Error('Failed to resume Square subscription');
    }

    // 更新本地数据库
    await prisma.subscription.updateMany({
      where: {
        gatewaySubscriptionId: subscriptionId,
        gateway: 'square'
      },
      data: {
        status: 'active',
        metadata: {
          resumedAt: new Date().toISOString(),
          resumedBy: 'user'
        }
      }
    });

    console.log('✅ Square subscription resumed:', subscriptionId);
    return true;

  } catch (error) {
    console.error('❌ Failed to resume Square subscription:', error);
    throw error;
  }
};
