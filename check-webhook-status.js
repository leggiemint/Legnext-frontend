const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkWebhookStatus() {
  console.log('🔍 Checking webhook processing status...');
  
  try {
    // 1. 检查用户当前状态
    const user = await prisma.user.findUnique({
      where: { email: 'huikai.work@gmail.com' },
      include: { profile: true }
    });
    
    console.log('👤 Current User Status:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Plan: ${user.profile?.plan || 'No profile'}`);
    console.log(`- Subscription Status: ${user.profile?.subscriptionStatus || 'No profile'}`);
    console.log(`- API Calls: ${user.profile?.apiCalls || 0}`);
    
    // 2. 检查Customer记录
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id }
    });
    
    console.log('\n💳 Customer Status:');
    if (customer) {
      console.log(`- Stripe Customer ID: ${customer.stripeCustomerId || 'None'}`);
      console.log(`- Created: ${customer.createdAt}`);
    } else {
      console.log('- No customer record found');
    }
    
    // 3. 检查最近的webhook事件
    const recentWebhooks = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`\n📡 Recent Webhook Events (${recentWebhooks.length}):`);
    if (recentWebhooks.length === 0) {
      console.log('❌ No webhook events found - this is the problem!');
      console.log('💡 Stripe webhooks are not being processed');
    } else {
      recentWebhooks.forEach(w => {
        console.log(`- ${w.createdAt.toISOString()}: ${w.eventType} - ${w.status}`);
        if (w.error) {
          console.log(`  ❌ Error: ${w.error}`);
        }
      });
    }
    
    // 4. 检查最近的交易记录
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`\n💰 Recent Transactions (${recentTransactions.length}):`);
    recentTransactions.forEach(t => {
      console.log(`- ${t.createdAt.toISOString()}: ${t.type} - $${t.amount} - ${t.status} - ${t.gateway}`);
    });
    
    // 5. 诊断问题
    console.log('\n🩺 Diagnosis:');
    if (recentWebhooks.length === 0) {
      console.log('❌ PRIMARY ISSUE: No webhook events recorded');
      console.log('🔧 Possible causes:');
      console.log('   1. Webhook endpoint not configured in Stripe dashboard');
      console.log('   2. Webhook URL incorrect or not accessible');
      console.log('   3. Webhook processing failed silently');
      console.log('   4. Using test mode but webhook points to wrong endpoint');
    }
    
    if (customer && customer.stripeCustomerId) {
      console.log('✅ Customer record exists - checkout created successfully');
      console.log('❌ But no subscription events processed - webhook issue');
    }
    
    // 6. 提供解决方案
    console.log('\n💡 Next Steps:');
    console.log('1. Check Stripe Dashboard webhook settings');
    console.log('2. Test webhook endpoint manually');
    console.log('3. Check webhook secret configuration');
    console.log('4. Monitor webhook event delivery in Stripe');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkWebhookStatus();
}

module.exports = { checkWebhookStatus };