const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixUserCustomer() {
  console.log('🔧 Fixing user customer connection...');
  
  try {
    // 使用你的实际邮箱和最新的Stripe customer ID
    const yourEmail = 'huikai.work@gmail.com';
    const stripeCustomerId = 'cus_T1yKJBXJXMLJq7'; // 最新的customer ID
    
    console.log(`📧 Target email: ${yourEmail}`);
    console.log(`💳 Target Stripe ID: ${stripeCustomerId}`);
    
    // 1. 验证Stripe customer存在
    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
    console.log(`✅ Verified Stripe customer: ${stripeCustomer.email}`);
    
    // 2. 查看这个客户的invoices
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 10
    });
    console.log(`📄 Found ${invoices.data.length} invoices for this customer:`);
    
    if (invoices.data.length > 0) {
      invoices.data.forEach((invoice, index) => {
        console.log(`  ${index + 1}. ${invoice.id} - ${invoice.status} - $${(invoice.total / 100).toFixed(2)} - ${invoice.description || 'No description'}`);
      });
    } else {
      console.log('  No invoices found for this customer.');
    }
    
    // 3. 更新数据库中的用户记录
    const user = await prisma.user.findUnique({
      where: { email: yourEmail }
    });
    
    if (!user) {
      console.log(`❌ User not found: ${yourEmail}`);
      return;
    }
    
    console.log(`✅ Found user: ${user.id}`);
    
    // 4. 更新Customer记录
    await prisma.customer.update({
      where: { userId: user.id },
      data: {
        stripeCustomerId: stripeCustomerId
      }
    });
    
    console.log(`✅ Updated customer record with Stripe ID: ${stripeCustomerId}`);
    
    console.log('\\n🎉 Setup complete!');
    console.log('\\n📱 How to test:');
    console.log(`1. Sign in with: ${yourEmail}`);
    console.log('2. Visit: http://localhost:3001/app/invoice');
    console.log('3. You should now see your Stripe invoices');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixUserCustomer();
}

module.exports = { fixUserCustomer };