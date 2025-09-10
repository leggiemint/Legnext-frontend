const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testInvoiceAPI() {
  console.log('🧪 Testing Invoice API Integration');
  console.log('=================================\\n');
  
  try {
    // 1. 验证测试用户存在
    const user = await prisma.user.findUnique({
      where: { email: 'invoice-test@example.com' },
      include: {
        profile: true
      }
    });
    
    if (!user) {
      console.log('❌ Test user not found. Run: node test-invoice-setup.js');
      return;
    }
    
    console.log(`✅ Found test user: ${user.email} (${user.id})`);
    
    // 2. 验证Customer记录
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id }
    });
    
    if (!customer?.stripeCustomerId) {
      console.log('❌ No Stripe customer ID found in database');
      return;
    }
    
    console.log(`✅ Found Stripe customer ID: ${customer.stripeCustomerId}`);
    
    // 3. 直接从Stripe获取invoices（模拟API调用）
    console.log('\\n📄 Fetching invoices from Stripe...');
    
    const stripeInvoices = await stripe.invoices.list({
      customer: customer.stripeCustomerId,
      limit: 10,
      expand: ['data.payment_intent', 'data.subscription']
    });
    
    console.log(`Found ${stripeInvoices.data.length} invoices:`);
    
    stripeInvoices.data.forEach((invoice, index) => {
      let status = invoice.status;
      if (status === 'open') status = 'pending';
      if (status === 'draft') status = 'pending';
      
      console.log(`  ${index + 1}. ${invoice.id}`);
      console.log(`     Status: ${status}`);
      console.log(`     Amount: $${(invoice.total / 100).toFixed(2)}`);
      console.log(`     Description: ${invoice.description}`);
      console.log(`     Created: ${new Date(invoice.created * 1000).toLocaleDateString()}`);
      console.log(`     Metadata: ${JSON.stringify(invoice.metadata)}`);
      console.log('');
    });
    
    // 4. 测试API endpoint响应格式
    console.log('📊 Testing API response transformation...');
    
    const transformedInvoices = stripeInvoices.data.map(invoice => {
      let status = 'pending';
      switch (invoice.status) {
        case 'paid': status = 'paid'; break;
        case 'open': status = 'pending'; break;
        case 'draft': status = 'pending'; break;
        case 'uncollectible': status = 'failed'; break;
        case 'void': status = 'canceled'; break;
        default: status = 'pending';
      }
      
      return {
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: invoice.total / 100,
        currency: invoice.currency.toUpperCase(),
        status,
        description: invoice.description || 'Subscription Payment',
        paymentMethod: 'Credit Card', // 简化处理
        items: invoice.lines?.data?.map(line => ({
          description: line.description || 'Service',
          amount: line.amount / 100,
          quantity: line.quantity || 1
        })) || [],
        metadata: {
          planName: invoice.metadata?.planName || 'Unknown',
          credits: invoice.metadata?.credits ? parseInt(invoice.metadata.credits) : undefined,
          gateway: 'stripe'
        }
      };
    });
    
    console.log(`✅ Transformed ${transformedInvoices.length} invoices to API format`);
    
    // 5. 汇总统计
    const summary = {
      totalInvoices: transformedInvoices.length,
      paidInvoices: transformedInvoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: transformedInvoices.filter(inv => inv.status === 'pending').length,
      totalAmount: transformedInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0),
      lastInvoiceDate: transformedInvoices.length > 0 ? transformedInvoices[0].date : null
    };
    
    console.log('\\n📈 Invoice Summary:');
    console.log(`  Total Invoices: ${summary.totalInvoices}`);
    console.log(`  Paid Invoices: ${summary.paidInvoices}`);
    console.log(`  Pending Invoices: ${summary.pendingInvoices}`);
    console.log(`  Total Paid Amount: $${summary.totalAmount.toFixed(2)}`);
    console.log(`  Last Invoice Date: ${summary.lastInvoiceDate ? new Date(summary.lastInvoiceDate).toLocaleDateString() : 'None'}`);
    
    // 6. 测试建议
    console.log('\\n🧪 Testing Instructions:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Visit: http://localhost:3001');
    console.log('  3. Sign in with: invoice-test@example.com');
    console.log('  4. Navigate to: /app/invoice');
    console.log('  5. You should see the invoices listed above');
    console.log('  6. Test the Stripe/Square tabs');
    console.log('  7. Check the gateway badges (blue for Stripe)');
    
    console.log('\\n✨ API test completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    if (error.type === 'StripeAuthenticationError') {
      console.log('🔐 Check your STRIPE_SECRET_KEY in .env.local');
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testInvoiceAPI();
}

module.exports = { testInvoiceAPI };