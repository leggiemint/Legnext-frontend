const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testCheckoutFlow() {
  console.log('🧪 Testing checkout flow after cleanup...');
  
  try {
    // 1. 检查用户状态
    const user = await prisma.user.findUnique({
      where: { email: 'huikai.work@gmail.com' },
      include: { profile: true }
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log('👤 User Status:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Plan: ${user.profile?.plan || 'No profile'}`);
    console.log(`- API Calls: ${user.profile?.apiCalls || 0}`);
    
    // 2. 检查Customer记录
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id }
    });
    
    console.log('\n💳 Customer Status:');
    if (customer) {
      console.log(`- Stripe Customer ID: ${customer.stripeCustomerId || 'None'}`);
      console.log(`- Customer record exists: ✅`);
    } else {
      console.log('- No customer record found: ✅ (Clean slate for new checkout)');
    }
    
    // 3. 模拟checkout请求检查
    console.log('\n🛒 Checkout Flow Test:');
    console.log('Testing if we can create a new checkout session...');
    
    // 模拟Stripe checkout创建的条件检查
    const canCreateCheckout = !customer || !customer.stripeCustomerId || customer.stripeCustomerId !== 'debug-customer-id';
    
    if (canCreateCheckout) {
      console.log('✅ Checkout flow should work - no invalid customer ID blocking');
      console.log('✅ Ready to create new Stripe customer and checkout session');
    } else {
      console.log('❌ Still blocked by debug customer ID');
    }
    
    // 4. 检查是否还有其他调试数据残留
    const debugTransactions = await prisma.transaction.count({
      where: {
        OR: [
          { gateway: 'debug' },
          { gatewayTxnId: { startsWith: 'debug-' } }
        ]
      }
    });
    
    console.log(`\n📊 Remaining debug data: ${debugTransactions} debug transactions`);
    console.log('💡 Debug transactions are kept for audit but don\'t affect checkout');
    
    console.log('\n🎯 Test Result:');
    console.log(canCreateCheckout ? 
      '✅ CHECKOUT SHOULD WORK NOW - Invalid debug customer ID has been removed' :
      '❌ CHECKOUT STILL BLOCKED - Debug customer ID still present'
    );
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testCheckoutFlow();
}

module.exports = { testCheckoutFlow };