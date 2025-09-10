const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function simulateWebhookProcessing() {
  console.log('🔄 Simulating webhook processing for recent payment...');
  
  try {
    // 1. 检查用户和Customer记录
    const user = await prisma.user.findUnique({
      where: { email: 'huikai.work@gmail.com' },
      include: { profile: true }
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id }
    });
    
    console.log('👤 User Info:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Current Plan: ${user.profile?.plan || 'free'}`);
    console.log(`- Current API Calls: ${user.profile?.apiCalls || 0}`);
    
    if (!customer?.stripeCustomerId) {
      console.error('❌ No Stripe customer ID found - checkout may have failed');
      return;
    }
    
    console.log(`💳 Stripe Customer ID: ${customer.stripeCustomerId}`);
    
    // 2. 查找最近的completed checkout sessions
    console.log('\n🔍 Looking for recent completed checkout sessions...');
    
    const sessions = await stripe.checkout.sessions.list({
      customer: customer.stripeCustomerId,
      limit: 10
    });
    
    const completedSessions = sessions.data.filter(s => 
      s.payment_status === 'paid' && 
      s.status === 'complete' &&
      s.mode === 'subscription'
    );
    
    if (completedSessions.length === 0) {
      console.log('❌ No completed checkout sessions found');
      console.log('💡 This suggests the payment may not have completed successfully');
      return;
    }
    
    console.log(`✅ Found ${completedSessions.length} completed sessions:`);
    completedSessions.forEach(session => {
      console.log(`- Session ${session.id}: ${session.payment_status}, subscription: ${session.subscription}`);
    });
    
    // 3. 处理最新的session
    const latestSession = completedSessions[0];
    console.log(`\n🔄 Processing latest session: ${latestSession.id}`);
    
    if (!latestSession.subscription) {
      console.error('❌ No subscription ID in session');
      return;
    }
    
    // 4. 获取订阅详情
    const subscription = await stripe.subscriptions.retrieve(latestSession.subscription);
    const priceId = subscription.items.data[0]?.price.id;
    
    console.log('📋 Subscription Details:');
    console.log(`- Subscription ID: ${subscription.id}`);
    console.log(`- Price ID: ${priceId}`);
    console.log(`- Status: ${subscription.status}`);
    console.log(`- Period: ${new Date(subscription.current_period_start * 1000)} to ${new Date(subscription.current_period_end * 1000)}`);
    
    // 5. 确定计划类型
    let plan = 'pro';
    let credits = 200;
    let backendCredits = 33000;
    
    // 根据价格ID确定计划（需要根据实际配置调整）
    if (priceId === 'price_1PwRCLKyeXh3bz3dYA6wSJYk') { // Pro plan price ID
      plan = 'pro';
      credits = 200;
      backendCredits = 33000;
    }
    
    console.log(`\n🎯 Plan Details:`);
    console.log(`- Plan: ${plan}`);
    console.log(`- Frontend Credits: ${credits}`);
    console.log(`- Backend Credits: ${backendCredits}`);
    
    // 6. 手动执行webhook处理逻辑
    console.log('\n⚡ Manually processing subscription activation...');
    
    // 模拟 updateSubscription 调用
    const { updateSubscription, grantCredits } = require('./libs/user-service');
    const { updateBackendAccountPlan, createBackendCreditPack } = require('./libs/backend-client');
    
    // 更新前端订阅
    const subscriptionResult = await updateSubscription(
      user.id,
      plan,
      'active',
      customer.stripeCustomerId,
      priceId,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000)
    );
    
    console.log('✅ Frontend subscription update:', subscriptionResult);
    
    // 添加credits
    const creditsResult = await grantCredits(
      user.id, 
      credits,
      `Pro subscription activation - Session ${latestSession.id}`
    );
    
    console.log('✅ Credits granted:', creditsResult);
    
    // 更新后端
    const backendAccountId = user.profile?.preferences?.backendAccountId;
    if (backendAccountId) {
      console.log(`🔄 Updating backend account: ${backendAccountId}`);
      
      const backendPlan = plan === 'pro' ? 'developer' : 'hobbyist';
      const planResult = await updateBackendAccountPlan({
        accountId: backendAccountId,
        newPlan: backendPlan
      });
      
      console.log('✅ Backend plan update:', planResult);
      
      if (backendCredits > 0) {
        const creditPackResult = await createBackendCreditPack({
          accountId: backendAccountId,
          credits: backendCredits
        });
        
        console.log('✅ Backend credits added:', creditPackResult);
      }
    } else {
      console.log('⚠️ No backend account ID found - skipping backend updates');
    }
    
    // 7. 记录webhook事件
    await prisma.webhookEvent.create({
      data: {
        provider: 'stripe',
        eventId: `manual_${Date.now()}`,
        eventType: 'checkout.session.completed',
        processed: true,
        processedAt: new Date(),
        metadata: {
          sessionId: latestSession.id,
          subscriptionId: subscription.id,
          userId: user.id,
          manual: true
        }
      }
    });
    
    console.log('\n🎉 Manual webhook processing completed successfully!');
    console.log('💡 The user should now have the updated plan and credits');
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  simulateWebhookProcessing();
}

module.exports = { simulateWebhookProcessing };