const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkCurrentStatus() {
  console.log('🔍 Checking current subscription status after cancel attempt...');
  console.log('==============================================================\n');
  
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
    
    const subscription = await stripe.subscriptions.retrieve('sub_1S5uNyKyeXh3bz3d4eY8Zw8h');
    
    console.log('📊 Current Status:');
    console.log('==================');
    console.log(`👤 User: ${user.email}`);
    console.log(`🗄️  Database plan: ${user.profile?.plan}`);
    console.log(`🗄️  Database subscription status: ${user.profile?.subscriptionStatus}`);
    console.log(`💳 Stripe subscription status: ${subscription.status}`);
    console.log(`⏰ Cancel at period end: ${subscription.cancel_at_period_end}`);
    console.log(`📅 Current period end: ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`);
    
    console.log('\\n🎯 Analysis:');
    console.log('=============');
    
    if (subscription.cancel_at_period_end) {
      console.log('✅ SUCCESS: Subscription WAS successfully canceled (scheduled for period end)');
      console.log('📝 What this means:');
      console.log('   - ✅ Cancellation request was processed');
      console.log('   - 🔄 Subscription will auto-cancel on period end date');
      console.log('   - 💰 User keeps Pro features until period end');
      console.log('   - 🗄️  Database plan stays "pro" until actual cancellation');
      
      console.log('\\n❗ UI Issue Found:');
      console.log('=================');
      console.log('❌ The success message says "账户已降级为免费计划"');
      console.log('✅ But for period-end cancellation, account should NOT be downgraded immediately');
      console.log('💡 The message should say something like:');
      console.log('   "订阅将在 [date] 取消。您可以继续使用Pro功能直到那时。"');
      
    } else {
      console.log('❓ Subscription is not marked for cancellation');
      console.log('🔧 This suggests the cancel request may have failed or UI needs refresh');
    }
    
    console.log('\\n🛠️  Recommended UI fixes:');
    console.log('==========================');
    console.log('1. Update success message for period-end cancellation');
    console.log('2. Show cancellation date in subscription status');
    console.log('3. Change button to "Reactivate Subscription" when canceled');
    console.log('4. Keep showing Pro plan status until period end');
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkCurrentStatus();
}

module.exports = { checkCurrentStatus };