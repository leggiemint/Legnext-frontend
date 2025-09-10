const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupRealUserInvoices() {
  console.log('🔧 Setting up invoice access for your real user account...');
  
  try {
    // 1. 获取所有现有的Stripe customers
    console.log('📋 Checking existing Stripe customers...');
    const customers = await stripe.customers.list({ limit: 20 });
    
    console.log(`Found ${customers.data.length} Stripe customers:`);
    customers.data.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.id} - ${customer.email || 'No email'} - ${customer.name || 'No name'}`);
    });
    
    // 2. 获取数据库中的用户
    console.log('\\n👤 Checking database users...');
    const users = await prisma.user.findMany({
      include: {
        profile: true
      }
    });
    
    console.log(`Found ${users.length} database users:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.id} - ${user.email} - ${user.name || 'No name'}`);
    });
    
    // 3. 检查现有的Customer记录
    console.log('\\n💳 Checking existing Customer records...');
    const existingCustomers = await prisma.customer.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`Found ${existingCustomers.length} customer records:`);
    existingCustomers.forEach((customer, index) => {
      console.log(`  ${index + 1}. User: ${customer.user.email} - Stripe ID: ${customer.stripeCustomerId || 'None'}`);
    });
    
    // 4. 为你的真实账户设置Customer记录
    console.log('\\n🎯 Setting up customer record for your account...');
    console.log('\\nPlease follow these steps:');
    console.log('1. Choose your email from the database users list above');
    console.log('2. Choose a Stripe customer ID from the Stripe customers list above');
    console.log('3. Update the script with your details, or manually create the record:');
    
    // 示例 - 你需要根据实际情况修改这些值
    const yourEmail = 'huikai.work@gmail.com'; // 替换为你的实际邮箱
    const stripeCustomerId = 'cus_SdGUJm6Dw9Eqhf'; // 替换为你在Stripe中的实际customer ID
    
    console.log(`\\nExample setup for ${yourEmail}:`);
    
    const user = await prisma.user.findUnique({
      where: { email: yourEmail }
    });
    
    if (user) {
      console.log(`✅ Found user: ${user.id}`);
      
      // 检查是否已有Customer记录
      let customer = await prisma.customer.findUnique({
        where: { userId: user.id }
      });
      
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            userId: user.id,
            stripeCustomerId: stripeCustomerId
          }
        });
        console.log(`✅ Created customer record with Stripe ID: ${stripeCustomerId}`);
      } else {
        customer = await prisma.customer.update({
          where: { userId: user.id },
          data: {
            stripeCustomerId: stripeCustomerId
          }
        });
        console.log(`🔄 Updated customer record with Stripe ID: ${stripeCustomerId}`);
      }
      
      // 验证连接
      console.log('\\n🧪 Testing Stripe connection...');
      const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
      console.log(`✅ Verified Stripe customer: ${stripeCustomer.email}`);
      
      const invoices = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit: 5
      });
      console.log(`📄 Found ${invoices.data.length} invoices for this customer`);
      
      if (invoices.data.length > 0) {
        console.log('Recent invoices:');
        invoices.data.forEach((invoice, index) => {
          console.log(`  ${index + 1}. ${invoice.id} - ${invoice.status} - $${(invoice.total / 100).toFixed(2)}`);
        });
      }
      
      console.log('\\n🎉 Setup complete!');
      console.log('\\n📱 How to test:');
      console.log(`1. Sign in with: ${yourEmail}`);
      console.log('2. Visit: http://localhost:3001/app/invoice');
      console.log('3. You should now see your Stripe invoices');
      
    } else {
      console.log(`❌ User not found: ${yourEmail}`);
      console.log('Please update the yourEmail variable in the script');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    if (error.message.includes('No such customer')) {
      console.log('🔍 The Stripe customer ID might be incorrect. Check the list above.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupRealUserInvoices();
}

module.exports = { setupRealUserInvoices };