const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function cleanupDebugData() {
  console.log('🧹 Cleaning up debug customer data...');
  
  try {
    // 查找所有带有调试客户ID的记录  
    const debugCustomers = await prisma.customer.findMany({
      where: {
        stripeCustomerId: 'debug-customer-id'
      },
      include: { user: true }
    });
    
    console.log(`Found ${debugCustomers.length} debug customer records:`);
    debugCustomers.forEach(c => {
      console.log(`- User: ${c.user.email}, Stripe: ${c.stripeCustomerId}`);
    });
    
    // 删除这些无效的客户记录
    if (debugCustomers.length > 0) {
      const deleted = await prisma.customer.deleteMany({
        where: {
          stripeCustomerId: 'debug-customer-id'
        }
      });
      console.log(`✅ Deleted ${deleted.count} debug customer records`);
    } else {
      console.log('✅ No debug customer records found to clean up');
    }
    
    // 检查是否还有其他调试相关的数据
    const debugTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { gateway: 'debug' },
          { type: 'debug_cancellation' },
          { gatewayTxnId: { startsWith: 'debug-' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`\n📋 Found ${debugTransactions.length} debug transactions (showing recent 10):`);
    debugTransactions.forEach(t => {
      console.log(`- ${t.createdAt.toISOString()}: ${t.type} - ${t.gateway} - ${t.gatewayTxnId}`);
    });
    
    if (debugTransactions.length > 0) {
      console.log('\n💡 Note: Debug transactions are kept for audit trail, but we can remove them if needed');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  cleanupDebugData();
}

module.exports = { cleanupDebugData };