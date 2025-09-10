#!/usr/bin/env node

/**
 * Square 订阅计划初始化脚本
 * 运行此脚本来创建必要的订阅计划和变体
 */

const { PrismaClient } = require('@prisma/client');
const { SquareClient, Environment } = require('squareup');
const crypto = require('crypto');

const prisma = new PrismaClient();

// 获取 Square 客户端
function getSquareClient() {
  const clientConfig = {
    environment: (process.env.SQUARE_ENVIRONMENT || 'sandbox') === 'production' 
      ? Environment.Production 
      : Environment.Sandbox,
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    timeout: 10000,
  };

  return new SquareClient(clientConfig);
}

// 创建订阅计划
async function createSubscriptionPlan(planData) {
  const client = getSquareClient();
  
  try {
    console.log('🏗️ Creating Square subscription plan:', planData);

    // 创建订阅计划的 Catalog 对象
    const catalogObject = {
      type: 'SUBSCRIPTION_PLAN',
      id: `#${planData.name.toLowerCase().replace(/\s+/g, '-')}-plan`,
      subscriptionPlanData: {
        name: planData.name,
        phases: [{
          cadence: 'MONTHLY',
          periods: 1,
          recurringPriceMoney: {
            amount: BigInt(planData.monthlyPriceAmount),
            currency: 'USD'
          }
        }]
      }
    };

    // 使用 Square SDK 创建 Catalog 对象
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
        catalogObjectId: createdPlan.id,
        name: planData.name,
        description: planData.description,
        monthlyPriceAmount: BigInt(planData.monthlyPriceAmount),
        currency: planData.currency || 'USD',
        catalogVersion: createdPlan.version ? BigInt(createdPlan.version) : null,
      }
    });

    // 创建计划变体
    const variationObject = {
      type: 'SUBSCRIPTION_PLAN_VARIATION',
      id: `#${planData.name.toLowerCase().replace(/\s+/g, '-')}-monthly-variation`,
      subscriptionPlanVariationData: {
        name: 'Monthly',
        subscriptionPlanId: createdPlan.id,
        phases: [{
          cadence: 'MONTHLY',
          periods: 1,
          recurringPriceMoney: {
            amount: BigInt(planData.monthlyPriceAmount),
            currency: 'USD'
          }
        }]
      }
    };

    const variationResponse = await client.catalog.batchUpsert({
      idempotencyKey: crypto.randomUUID(),
      batches: [{
        objects: [variationObject]
      }]
    });

    if (!variationResponse.objects || variationResponse.objects.length === 0) {
      throw new Error('Failed to create subscription plan variation');
    }

    const createdVariation = variationResponse.objects[0];
    console.log('✅ Square plan variation created:', {
      id: createdVariation.id,
      name: 'Monthly',
      version: createdVariation.version
    });

    // 保存变体到数据库
    const dbVariation = await prisma.squarePlanVariation.create({
      data: {
        planId: dbPlan.id,
        catalogObjectId: createdVariation.id,
        name: 'Monthly',
        cadence: 'MONTHLY',
        periods: 1,
        priceAmount: BigInt(planData.monthlyPriceAmount),
        currency: 'USD',
        catalogVersion: createdVariation.version ? BigInt(createdVariation.version) : null,
      }
    });

    return {
      plan: dbPlan,
      variation: dbVariation
    };

  } catch (error) {
    console.error('❌ Failed to create subscription plan:', error);
    throw error;
  }
}

// 主初始化函数
async function initializeSquareSubscriptions() {
  try {
    console.log('🚀 Starting Square subscription initialization...');

    // 检查是否已经有计划
    const existingPlans = await prisma.squareSubscriptionPlan.findMany();
    if (existingPlans.length > 0) {
      console.log('✅ Subscription plans already exist, skipping initialization');
      console.log('Existing plans:', existingPlans.map(p => ({ id: p.id, name: p.name })));
      return;
    }

    // 创建 Pro 订阅计划
    const proPlan = await createSubscriptionPlan({
      name: 'Pro Plan',
      description: 'Monthly Pro subscription with 30,000 API points',
      monthlyPriceAmount: 3000, // $30.00 in cents
      currency: 'USD'
    });

    console.log('✅ Square subscription plans initialized successfully!');
    console.log('Created plans:', {
      proPlan: {
        id: proPlan.plan.id,
        catalogObjectId: proPlan.plan.catalogObjectId,
        name: proPlan.plan.name
      },
      proVariation: {
        id: proPlan.variation.id,
        catalogObjectId: proPlan.variation.catalogObjectId,
        name: proPlan.variation.name
      }
    });

    console.log('\n📋 Next steps:');
    console.log('1. Update your Square Developer Dashboard webhook settings');
    console.log('2. Configure the following webhook events:');
    console.log('   - subscription.created');
    console.log('   - subscription.updated');
    console.log('   - subscription.canceled');
    console.log('   - invoice.payment_made');
    console.log('   - invoice.payment_failed');
    console.log('3. Test the subscription flow in sandbox mode');
    console.log('4. Deploy to production when ready');

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行初始化
if (require.main === module) {
  initializeSquareSubscriptions();
}

module.exports = { initializeSquareSubscriptions };
