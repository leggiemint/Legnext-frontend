const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function setupTestUser() {
  console.log('🔧 Setting up test user for invoice testing...');
  
  try {
    // 1. 创建或获取测试用户
    let user = await prisma.user.findUnique({
      where: { email: 'invoice-test@example.com' }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'invoice-test@example.com',
          name: 'Invoice Test User',
          emailVerified: new Date()
        }
      });
      console.log(`✅ Created user: ${user.id}`);
    } else {
      console.log(`👤 Using existing user: ${user.id}`);
    }
    
    // 2. 创建或更新用户Profile
    let userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id }
    });
    
    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          plan: 'pro',
          subscriptionStatus: 'active',
          apiCalls: 5000,
          totalApiCallsUsed: 0,
          totalApiCallsPurchased: 5000,
          preferences: {
            backendAccountId: 'test-backend-123'
          }
        }
      });
      console.log(`✅ Created user profile: ${userProfile.id}`);
    } else {
      console.log(`📊 Using existing user profile: ${userProfile.id}`);
    }
    
    // 3. 创建或更新Customer记录（关键步骤！）
    let customer = await prisma.customer.findUnique({
      where: { userId: user.id }
    });
    
    const stripeCustomerId = 'cus_T1ykjbTYNFkVQU'; // 从之前的脚本获得的customer ID
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId: user.id,
          stripeCustomerId: stripeCustomerId
        }
      });
      console.log(`✅ Created customer record with Stripe ID: ${stripeCustomerId}`);
    } else {
      // 更新现有customer记录
      customer = await prisma.customer.update({
        where: { userId: user.id },
        data: {
          stripeCustomerId: stripeCustomerId
        }
      });
      console.log(`🔄 Updated customer record with Stripe ID: ${stripeCustomerId}`);
    }
    
    console.log('\\n🎉 Test user setup complete!');
    console.log('\\n📋 Test Account Details:');
    console.log(`  📧 Email: ${user.email}`);
    console.log(`  👤 User ID: ${user.id}`);
    console.log(`  💳 Stripe Customer ID: ${stripeCustomerId}`);
    console.log(`  📊 Plan: ${userProfile.plan}`);
    
    console.log('\\n🧪 How to test:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Sign in with email: invoice-test@example.com');
    console.log('  3. Visit: http://localhost:3001/app/invoice');
    console.log('  4. You should see Stripe invoices from the previous script');
    
    return { user, userProfile, customer };
    
  } catch (error) {
    console.error('❌ Error setting up test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 检查现有的Stripe invoices
async function checkStripeInvoices() {
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  console.log('\\n📋 Checking existing Stripe invoices...');
  
  try {
    const invoices = await stripe.invoices.list({
      customer: 'cus_T1ykjbTYNFkVQU',
      limit: 10
    });
    
    console.log(`Found ${invoices.data.length} invoices for test customer:`);
    invoices.data.forEach((invoice, index) => {
      console.log(`  ${index + 1}. ${invoice.id} - ${invoice.status} - $${(invoice.total / 100).toFixed(2)} - ${invoice.description}`);
    });
    
    if (invoices.data.length === 0) {
      console.log('⚠️  No invoices found. Run the invoice creation script first:');
      console.log('   node test-stripe-invoices-simple.js');
    }
    
    return invoices.data;
    
  } catch (error) {
    console.error('❌ Error checking Stripe invoices:', error.message);
    return [];
  }
}

async function main() {
  console.log('🧪 Invoice Testing Setup Script');
  console.log('===============================\\n');
  
  try {
    await checkStripeInvoices();
    await setupTestUser();
    
    console.log('\\n✨ Setup complete! Ready for invoice testing.');
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupTestUser, checkStripeInvoices };