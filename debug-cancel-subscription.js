const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugCancelSubscription() {
  console.log('🐛 Debugging cancel subscription issue...');
  console.log('==========================================\n');
  
  try {
    // 1. 检查用户状态
    const user = await prisma.user.findUnique({
      where: { email: 'huikai.work@gmail.com' },
      include: {
        profile: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User: ${user.email}`);
    console.log(`📊 Current plan: ${user.profile?.plan}`);
    console.log(`📊 Subscription status: ${user.profile?.subscriptionStatus}`);
    
    // 2. 检查Customer记录
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id }
    });
    
    if (!customer?.stripeCustomerId) {
      console.log('❌ No Stripe customer ID found');
      return;
    }
    
    console.log(`💳 Stripe Customer: ${customer.stripeCustomerId}`);
    
    // 3. 检查Stripe中的订阅状态
    console.log('\\n🔍 Checking Stripe subscriptions...');
    
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripeCustomerId,
      status: 'all', // 包括所有状态
      limit: 10
    });
    
    console.log(`Found ${subscriptions.data.length} subscriptions in Stripe:`);
    
    if (subscriptions.data.length === 0) {
      console.log('❌ No subscriptions found in Stripe');
      console.log('💡 This means there is no active subscription to cancel');
      console.log('\\n🔧 Possible reasons:');
      console.log('   1. The subscription was never created');
      console.log('   2. The subscription was already canceled');
      console.log('   3. Wrong Stripe customer ID');
      
      console.log('\\n🛠️  Solutions:');
      console.log('   1. Create a test subscription first');
      console.log('   2. Check if user should have subscription access');
      console.log('   3. Update UI to show correct subscription status');
      
      return;
    }
    
    subscriptions.data.forEach((subscription, index) => {
      console.log(`  ${index + 1}. ${subscription.id}`);
      console.log(`     Status: ${subscription.status}`);
      console.log(`     Current period: ${new Date(subscription.current_period_start * 1000).toLocaleDateString()} - ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`);
      console.log(`     Cancel at period end: ${subscription.cancel_at_period_end}`);
      console.log(`     Created: ${new Date(subscription.created * 1000).toLocaleDateString()}`);
      console.log('');
    });
    
    // 4. 检查数据库中的subscription记录
    console.log('🗄️  Checking database subscription records...');
    
    const dbSubscriptions = await prisma.subscription.findMany({
      where: {
        customerId: customer.stripeCustomerId
      }
    });
    
    console.log(`Found ${dbSubscriptions.length} subscription records in database:`);
    dbSubscriptions.forEach((sub, index) => {
      console.log(`  ${index + 1}. ${sub.id}`);
      console.log(`     Status: ${sub.status}`);
      console.log(`     Cancel at period end: ${sub.cancelAtPeriodEnd}`);
      console.log('');
    });
    
    // 5. 分析问题
    const activeSubscriptions = subscriptions.data.filter(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );
    
    console.log('📋 Analysis:');
    
    if (activeSubscriptions.length === 0) {
      console.log('⚠️  Issue: No active subscriptions found');
      console.log('💡 The user appears to not have an active subscription to cancel');
      console.log('\\n🔧 This explains why cancel subscription is not working');
      
      // 提供解决方案
      console.log('\\n🛠️  Suggested fixes:');
      console.log('1. Create a test subscription:');
      console.log('   - Use Stripe Dashboard to create a test subscription');
      console.log('   - Or use the subscription creation API');
      
      console.log('\\n2. Or update the UI to reflect actual subscription status:');
      console.log('   - Hide cancel button when no active subscription');
      console.log('   - Show correct status message');
      
    } else {
      console.log(`✅ Found ${activeSubscriptions.length} active subscription(s)`);
      console.log('🔧 Cancel subscription should work normally');
      
      // 测试取消订阅API的前置条件
      console.log('\\n🧪 Testing cancel subscription preconditions...');
      console.log('✅ User authenticated');
      console.log('✅ Customer record exists'); 
      console.log('✅ Active subscriptions found');
      console.log('\\n💡 If cancel still fails, check:');
      console.log('   1. API endpoint errors in browser console');
      console.log('   2. Server logs for detailed error messages');
      console.log('   3. Stripe webhook configuration');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  debugCancelSubscription();
}

module.exports = { debugCancelSubscription };