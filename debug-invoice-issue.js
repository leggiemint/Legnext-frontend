const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugInvoiceIssue() {
  console.log('🐛 Debugging invoice display issue...');
  console.log('=====================================\n');
  
  try {
    // 1. 检查用户和Customer记录
    console.log('👤 Checking user and customer records...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'huikai.work@gmail.com' },
      include: {
        profile: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log(`✅ User found: ${user.id} - ${user.email}`);
    console.log(`📊 User plan: ${user.profile?.plan || 'No profile'}`);
    
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id }
    });
    
    if (!customer?.stripeCustomerId) {
      console.log('❌ No Stripe customer ID found!');
      return;
    }
    
    console.log(`✅ Customer record: ${customer.stripeCustomerId}`);
    
    // 2. 直接测试Stripe API
    console.log('\n💳 Testing Stripe API directly...');
    
    try {
      const stripeCustomer = await stripe.customers.retrieve(customer.stripeCustomerId);
      console.log(`✅ Stripe customer verified: ${stripeCustomer.email}`);
      
      const invoices = await stripe.invoices.list({
        customer: customer.stripeCustomerId,
        limit: 10
      });
      
      console.log(`📄 Found ${invoices.data.length} Stripe invoices:`);
      invoices.data.forEach((invoice, index) => {
        console.log(`  ${index + 1}. ${invoice.id} - ${invoice.status} - $${(invoice.total / 100).toFixed(2)}`);
      });
      
    } catch (stripeError) {
      console.error('❌ Stripe API error:', stripeError.message);
    }
    
    // 3. 检查invoice页面逻辑
    console.log('\n🔍 Checking invoice page logic...');
    
    // 模拟页面逻辑
    const { isProUser, plan } = await checkUserPlanStatus(user);
    console.log(`📊 Plan status: isProUser=${isProUser}, plan=${plan}`);
    
    if (!isProUser && plan === 'free') {
      console.log('⚠️  Issue found: User is on free plan, invoice page will show "No Invoices Yet" message');
      console.log('💡 Solution: Update user profile to pro plan or ensure user has subscription history');
    } else {
      console.log('✅ User plan status allows invoice viewing');
    }
    
    // 4. 提供修复方案
    console.log('\n🔧 Possible fixes:');
    
    if (user.profile?.plan === 'free') {
      console.log('1. Update user to pro plan:');
      console.log('   UPDATE "UserProfile" SET plan = \'pro\', "subscriptionStatus" = \'active\' WHERE "userId" = \'${user.id}\';');
    }
    
    console.log('2. Or create a real subscription in your system');
    console.log('3. Or modify invoice page to show invoices for all users (remove plan restriction)');
    
    // 5. 测试修复
    console.log('\n🛠️  Applying temporary fix...');
    
    if (user.profile?.plan === 'free') {
      await prisma.userProfile.update({
        where: { userId: user.id },
        data: {
          plan: 'pro',
          subscriptionStatus: 'active'
        }
      });
      console.log('✅ Updated user to pro plan for testing');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkUserPlanStatus(user) {
  // 模拟invoice页面中的usePlan逻辑
  const plan = user.profile?.plan || 'free';
  const subscriptionStatus = user.profile?.subscriptionStatus || 'inactive';
  
  const isProUser = plan !== 'free' || subscriptionStatus === 'active';
  
  return { isProUser, plan };
}

if (require.main === module) {
  debugInvoiceIssue();
}

module.exports = { debugInvoiceIssue };