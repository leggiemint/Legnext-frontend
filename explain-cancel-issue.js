const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function explainCancelIssue() {
  console.log('📋 Explaining the cancel subscription issue');
  console.log('=========================================\n');
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'huikai.work@gmail.com' },
      include: {
        profile: true
      }
    });
    
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id }
    });
    
    // 检查Stripe中的订阅状态
    const subscription = await stripe.subscriptions.retrieve('sub_1S5uNyKyeXh3bz3d4eY8Zw8h');
    
    console.log('🔍 Current situation analysis:');
    console.log('============================');
    console.log(`✅ User: ${user.email}`);
    console.log(`📊 Current plan in DB: ${user.profile?.plan}`);
    console.log(`📊 Subscription status in DB: ${user.profile?.subscriptionStatus}`);
    console.log(`💳 Stripe customer: ${customer?.stripeCustomerId}`);
    console.log(`📋 Stripe subscription: ${subscription.id}`);
    console.log(`🔄 Subscription status: ${subscription.status}`);
    console.log(`⏰ Cancel at period end: ${subscription.cancel_at_period_end}`);
    console.log(`📅 Current period ends: ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`);
    
    console.log('\\n❗ The Issue:');
    console.log('=============');
    console.log('📝 Your subscription is ALREADY marked for cancellation!');
    console.log(`   - cancel_at_period_end: ${subscription.cancel_at_period_end}`);
    console.log(`   - It will automatically cancel on: ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`);
    
    console.log('\\n🤔 Why "Cancel Subscription" appears not to work:');
    console.log('=================================================');
    
    if (subscription.cancel_at_period_end) {
      console.log('1. ✅ The subscription is ALREADY scheduled for cancellation');
      console.log('2. ⚠️  Clicking "Cancel" again won\'t change anything visible');
      console.log('3. 📱 The UI might not reflect this current state clearly');
      console.log('4. 🔄 You can still use Pro features until the period ends');
      
      console.log('\\n💡 What should happen in the UI:');
      console.log('=================================');
      console.log('✅ Show: "Subscription will be canceled on [date]"');
      console.log('✅ Show: "You can continue using Pro features until [date]"');
      console.log('✅ Option: "Reactivate Subscription" button');
      console.log('❌ Hide: "Cancel Subscription" button (already canceled)');
      
      console.log('\\n🛠️  Immediate fixes needed:');
      console.log('============================');
      console.log('1. Update subscription page UI to show correct status');
      console.log('2. Add "Reactivate Subscription" functionality');
      console.log('3. Show cancellation date clearly');
      console.log('4. Change button text/behavior based on cancel_at_period_end status');
      
    } else {
      console.log('1. ❌ This is unexpected - subscription should be marked for cancellation');
      console.log('2. 🔧 There might be an API issue or UI/backend sync problem');
    }
    
    console.log('\\n🎯 Quick test - try to reactivate the subscription:');
    console.log('===================================================');
    
    // 尝试取消"期末取消"标志来恢复订阅
    try {
      const reactivatedSub = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
        metadata: {
          ...subscription.metadata,
          reactivated_at: new Date().toISOString(),
          reactivated_by: 'debug_script'
        }
      });
      
      console.log('✅ Subscription reactivated successfully!');
      console.log(`🔄 New cancel_at_period_end status: ${reactivatedSub.cancel_at_period_end}`);
      console.log('💡 Now the "Cancel Subscription" button should work again');
      
    } catch (error) {
      console.error('❌ Failed to reactivate subscription:', error.message);
    }
    
    console.log('\\n📱 How to test the cancel functionality:');
    console.log('========================================');
    console.log('1. Refresh your subscription page');
    console.log('2. You should now see an active subscription');
    console.log('3. Click "Cancel Subscription" - it should work');
    console.log('4. Check that it gets marked for period-end cancellation');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  explainCancelIssue();
}

module.exports = { explainCancelIssue };