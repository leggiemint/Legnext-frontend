// Square 真正的订阅系统实现
// 使用 Catalog API 和 Subscriptions API

import { SquareClient, SquareEnvironment } from 'square';
import { prisma } from './prisma';
import crypto from 'crypto';

// 获取 Square 客户端
const getSquareClient = () => {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const environment = process.env.SQUARE_ENVIRONMENT;
  const proxyUrl = process.env.SQUARE_PROXY_URL;

  if (!token) {
    throw new Error('SQUARE_ACCESS_TOKEN is required but not configured');
  }

  if (!process.env.SQUARE_LOCATION_ID) {
    throw new Error('SQUARE_LOCATION_ID is required but not configured');
  }

  const clientConfig: any = {
    token: token,
    environment: environment === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
    timeout: 30000,
  };

  if (proxyUrl) {
    clientConfig.baseUrl = proxyUrl;
    clientConfig.headers = {
      'Square-Environment': environment || 'sandbox',
      'User-Agent': 'LegNext-Subscriptions/1.0',
      'X-Client-Version': '1.0.0',
    };
  }

  return new SquareClient(clientConfig);
};

// 创建或更新订阅计划到 Square Catalog
export const createSubscriptionPlan = async (planData: {
  name: string;
  description?: string;
  monthlyPriceAmount: number; // 价格（分）
  currency?: string;
}) => {
  const client = getSquareClient();
  
  try {
    console.log('🏗️ Creating Square subscription plan:', planData);

    // 创建订阅计划的 Catalog 对象
    const catalogObject = {
      type: 'SUBSCRIPTION_PLAN' as const,
      id: `#${planData.name.toLowerCase().replace(/\s+/g, '-')}-plan`,
      subscriptionPlanData: {
        name: planData.name,
        phases: [{
          cadence: 'MONTHLY' as const,
          periods: 1,
          recurringPriceMoney: {
            amount: BigInt(planData.monthlyPriceAmount),
            currency: 'USD' as const
          }
        }]
      }
    };

    // 使用正确的Square SDK方法创建或更新 Catalog 对象  
    const response = await client.catalog.batchUpsert({
      idempotencyKey: crypto.randomUUID(),
      batches: [{
        objects: [catalogObject]
      }]
    });

    if (!response.objects || response.objects.length === 0) {
      throw new Error('Failed to create subscription plan in Square Catalog');
    }

    const createdPlan = response.objects[0];
    console.log('✅ Square subscription plan created:', {
      id: createdPlan.id,
      name: planData.name,
      version: createdPlan.version
    });

    // 保存到本地数据库
    const dbPlan = await prisma.squareSubscriptionPlan.create({
      data: {
        catalogObjectId: createdPlan.id!,
        name: planData.name,
        description: planData.description,
        monthlyPriceAmount: BigInt(planData.monthlyPriceAmount),
        currency: planData.currency || 'USD',
        catalogVersion: createdPlan.version ? BigInt(createdPlan.version) : null,
      }
    });

    // 创建计划变体
    if (createdPlan.type === 'SUBSCRIPTION_PLAN' && (createdPlan as any).subscriptionPlanData?.phases?.[0]) {
      await prisma.squarePlanVariation.create({
        data: {
          planId: dbPlan.id,
          catalogObjectId: `${createdPlan.id}-variation-monthly`,
          name: 'Monthly',
          cadence: 'MONTHLY',
          periods: 1,
          priceAmount: BigInt(planData.monthlyPriceAmount),
          currency: planData.currency || 'USD',
          catalogVersion: createdPlan.version ? BigInt(createdPlan.version) : null,
        }
      });
    }

    return {
      catalogObjectId: createdPlan.id,
      localPlanId: dbPlan.id,
      version: createdPlan.version
    };

  } catch (error) {
    console.error('❌ Failed to create subscription plan:', error);
    throw error;
  }
};

// 创建或获取 Square 客户
export const createOrGetSquareCustomer = async (userData: {
  email: string;
  name?: string;
  userId: string;
}) => {
  const client = getSquareClient();
  
  try {
    console.log('👤 Creating/retrieving Square customer:', userData.email);

    // 检查数据库中是否已有 Square 客户 ID
    const existingCustomer = await prisma.customer.findUnique({
      where: { userId: userData.userId }
    });

    if (existingCustomer?.squareCustomerId) {
      console.log('✅ Found existing Square customer ID:', existingCustomer.squareCustomerId);
      return existingCustomer.squareCustomerId;
    }

    // 在 Square 中搜索现有客户
    const searchResponse = await client.customers.search({
      query: {
        filter: {
          emailAddress: {
            exact: userData.email
          }
        }
      }
    });

    let squareCustomer = searchResponse.customers?.[0];

    // 如果没有找到，创建新客户
    if (!squareCustomer) {
      const nameparts = userData.name?.split(' ') || ['Customer'];
      const createResponse = await client.customers.create({
        idempotencyKey: crypto.randomUUID(),
        givenName: nameparts[0],
        familyName: nameparts.slice(1).join(' ') || undefined,
        emailAddress: userData.email
      });
      
      squareCustomer = createResponse.customer;
    }

    if (!squareCustomer?.id) {
      throw new Error('Failed to create or retrieve Square customer');
    }

    console.log('✅ Square customer ready:', {
      id: squareCustomer.id,
      email: squareCustomer.emailAddress
    });

    // 更新或创建本地客户记录
    await prisma.customer.upsert({
      where: { userId: userData.userId },
      update: { squareCustomerId: squareCustomer.id },
      create: {
        userId: userData.userId,
        squareCustomerId: squareCustomer.id
      }
    });

    return squareCustomer.id;

  } catch (error) {
    console.error('❌ Failed to create/get Square customer:', error);
    throw error;
  }
};

// 创建 Square 订阅
export const createSquareSubscription = async (params: {
  customerId: string;
  planVariationId: string;
  userId: string;
}) => {
  const client = getSquareClient();
  
  try {
    console.log('🔄 Creating Square subscription:', params);

    // 获取计划变体信息
    const planVariation = await prisma.squarePlanVariation.findUnique({
      where: { catalogObjectId: params.planVariationId },
      include: { plan: true }
    });

    if (!planVariation) {
      throw new Error(`Plan variation not found: ${params.planVariationId}`);
    }

    // 创建订阅
    const response = await client.subscriptions.create({
      idempotencyKey: crypto.randomUUID(),
      locationId: process.env.SQUARE_LOCATION_ID!,
      planVariationId: params.planVariationId,
      customerId: params.customerId,
      startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      chargedThroughDate: undefined, // Let Square calculate
      invoiceRequestMethod: 'EMAIL',
      cardId: undefined, // Customer will provide payment method
      timezone: 'America/New_York', // TODO: Make configurable
    });

    if (!response.subscription) {
      throw new Error('Failed to create Square subscription');
    }

    const subscription = response.subscription;
    console.log('✅ Square subscription created:', {
      id: subscription.id,
      status: subscription.status,
      startDate: subscription.startDate
    });

    // 保存到本地数据库
    const dbSubscription = await prisma.subscription.create({
      data: {
        userId: params.userId,
        subscriptionId: subscription.id!,
        name: planVariation.plan.name,
        platform: 'square',
        status: subscription.status || 'active',
        squareSubscriptionId: subscription.id!,
        squarePlanVariationId: params.planVariationId,
        squareLocationId: process.env.SQUARE_LOCATION_ID!,
        currentPeriodStart: subscription.startDate ? new Date(subscription.startDate) : new Date(),
        // currentPeriodEnd will be updated from webhooks
      }
    });

    return {
      subscriptionId: subscription.id!,
      status: subscription.status,
      localSubscriptionId: dbSubscription.id
    };

  } catch (error) {
    console.error('❌ Failed to create Square subscription:', error);
    throw error;
  }
};

// 取消 Square 订阅
export const cancelSquareSubscription = async (subscriptionId: string) => {
  const client = getSquareClient();
  
  try {
    console.log('❌ Canceling Square subscription:', subscriptionId);

    // 取消订阅
    const response = await client.subscriptions.cancel({
      subscriptionId,
    });

    if (!response.subscription) {
      throw new Error('Failed to cancel Square subscription');
    }

    const subscription = response.subscription;
    console.log('✅ Square subscription canceled:', {
      id: subscription.id,
      status: subscription.status,
      canceledDate: subscription.canceledDate
    });

    // 更新本地数据库
    await prisma.subscription.updateMany({
      where: { squareSubscriptionId: subscriptionId },
      data: {
        status: 'canceled',
        cancelAtPeriodEnd: true
      }
    });

    return {
      subscriptionId: subscription.id!,
      status: subscription.status!,
      canceledDate: subscription.canceledDate
    };

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

    // 暂停订阅
    const response = await client.subscriptions.pause({
      subscriptionId,
      pauseEffectiveDate: new Date().toISOString().split('T')[0], // Today
      pauseReason: 'USER_REQUESTED'
    });

    if (!response.subscription) {
      throw new Error('Failed to pause Square subscription');
    }

    const subscription = response.subscription;
    console.log('✅ Square subscription paused:', {
      id: subscription.id,
      status: subscription.status
    });

    // 更新本地数据库
    await prisma.subscription.updateMany({
      where: { squareSubscriptionId: subscriptionId },
      data: { status: 'paused' }
    });

    return {
      subscriptionId: subscription.id!,
      status: subscription.status!
    };

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

    // 恢复订阅
    const response = await client.subscriptions.resume({
      subscriptionId,
      resumeEffectiveDate: new Date().toISOString().split('T')[0], // Today
      resumeChangeTiming: 'IMMEDIATE'
    });

    if (!response.subscription) {
      throw new Error('Failed to resume Square subscription');
    }

    const subscription = response.subscription;
    console.log('✅ Square subscription resumed:', {
      id: subscription.id,
      status: subscription.status
    });

    // 更新本地数据库
    await prisma.subscription.updateMany({
      where: { squareSubscriptionId: subscriptionId },
      data: { status: 'active' }
    });

    return {
      subscriptionId: subscription.id!,
      status: subscription.status!
    };

  } catch (error) {
    console.error('❌ Failed to resume Square subscription:', error);
    throw error;
  }
};

// 获取 Square 订阅详情
export const getSquareSubscription = async (subscriptionId: string) => {
  const client = getSquareClient();
  
  try {
    console.log('🔍 Getting Square subscription:', subscriptionId);

    // 获取订阅详情
    const response = await client.subscriptions.get({
      subscriptionId,
      include: 'actions'
    });

    if (!response.subscription) {
      throw new Error('Square subscription not found');
    }

    const subscription = response.subscription;
    console.log('✅ Square subscription retrieved:', {
      id: subscription.id,
      status: subscription.status,
      startDate: subscription.startDate
    });

    return subscription;

  } catch (error) {
    console.error('❌ Failed to get Square subscription:', error);
    throw error;
  }
};

// 初始化默认订阅计划
export const initializeSubscriptionPlans = async () => {
  try {
    console.log('🚀 Initializing Square subscription plans...');

    // 检查是否已经有计划
    const existingPlans = await prisma.squareSubscriptionPlan.findMany();
    if (existingPlans.length > 0) {
      console.log('✅ Subscription plans already exist, skipping initialization');
      return;
    }

    // 创建 Pro 订阅计划
    const proPlan = await createSubscriptionPlan({
      name: 'Pro Plan',
      description: 'Monthly Pro subscription with 30,000 API points',
      monthlyPriceAmount: 3000, // $30.00 in cents
      currency: 'USD'
    });

    console.log('✅ Subscription plans initialized:', {
      proPlan: proPlan.catalogObjectId
    });

    return { proPlan };

  } catch (error) {
    console.error('❌ Failed to initialize subscription plans:', error);
    throw error;
  }
};