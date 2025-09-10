const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testInvoiceWithSession() {
  console.log('🧪 Testing invoice functionality with user session simulation');
  console.log('=============================================================\n');
  
  try {
    // 1. 获取用户信息
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
    
    console.log(`✅ User: ${user.email} (${user.id})`);
    console.log(`📊 Plan: ${user.profile?.plan}, Status: ${user.profile?.subscriptionStatus}`);
    
    // 2. 检查是否符合invoice查看条件
    const isProUser = user.profile?.plan !== 'free' || user.profile?.subscriptionStatus === 'active';
    const plan = user.profile?.plan || 'free';
    
    console.log(`🔐 Access check: isProUser=${isProUser}, plan=${plan}`);
    
    if (!isProUser && plan === 'free') {
      console.log('❌ User would see "No Invoices Yet" message');
      console.log('   This is because the invoice page restricts access to pro users only');
      return;
    }
    
    console.log('✅ User has access to invoice page');
    
    // 3. 获取Customer记录
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id }
    });
    
    if (!customer?.stripeCustomerId) {
      console.log('❌ No Stripe customer ID found');
      return;
    }
    
    console.log(`💳 Stripe Customer: ${customer.stripeCustomerId}`);
    
    // 4. 模拟API调用 - 获取Stripe invoices
    console.log('\\n📄 Simulating /api/stripe/invoices call...');
    
    const stripeInvoices = await stripe.invoices.list({
      customer: customer.stripeCustomerId,
      limit: 20,
      expand: ['data.payment_intent', 'data.subscription']
    });
    
    // 5. 转换数据格式（与API相同）
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
      
      const items = invoice.lines?.data?.map(line => ({
        description: line.description || line.price?.nickname || 'Subscription',
        amount: line.amount / 100,
        quantity: line.quantity || 1
      })) || [];
      
      let planName = 'Unknown Plan';
      let credits = 0;
      
      if (invoice.subscription && typeof invoice.subscription === 'object') {
        const subscription = invoice.subscription;
        if (subscription.metadata?.planName) {
          planName = subscription.metadata.planName;
        }
        if (subscription.metadata?.credits) {
          credits = parseInt(subscription.metadata.credits);
        }
      }
      
      if (invoice.metadata?.planName) {
        planName = invoice.metadata.planName;
      }
      if (invoice.metadata?.credits) {
        credits = parseInt(invoice.metadata.credits);
      }
      
      let paymentMethod = 'Credit Card';
      if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
        const paymentIntent = invoice.payment_intent;
        if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'object') {
          const pm = paymentIntent.payment_method;
          if (pm.card?.brand) {
            paymentMethod = `${pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1)} •••• ${pm.card.last4}`;
          }
        }
      }
      
      return {
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: invoice.total / 100,
        currency: invoice.currency.toUpperCase(),
        status,
        description: invoice.description || `${planName} Subscription`,
        paymentMethod,
        items,
        metadata: {
          planName,
          credits: credits > 0 ? credits : undefined,
          gateway: 'stripe'
        }
      };
    });
    
    // 6. 计算汇总
    const summary = {
      totalInvoices: transformedInvoices.length,
      paidInvoices: transformedInvoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: transformedInvoices.filter(inv => inv.status === 'pending').length,
      totalAmount: transformedInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0),
      lastInvoiceDate: transformedInvoices.length > 0 ? transformedInvoices[0].date : null
    };
    
    // 7. 显示结果
    console.log(`✅ API simulation successful!`);
    console.log(`\\n📊 Invoice Summary:`);
    console.log(`   Total: ${summary.totalInvoices}`);
    console.log(`   Paid: ${summary.paidInvoices}`);
    console.log(`   Pending: ${summary.pendingInvoices}`);
    console.log(`   Total Amount: $${summary.totalAmount.toFixed(2)}`);
    
    console.log(`\\n📋 Invoice Details:`);
    transformedInvoices.forEach((invoice, index) => {
      console.log(`   ${index + 1}. ${invoice.id}`);
      console.log(`      Status: ${invoice.status}`);
      console.log(`      Amount: $${invoice.amount.toFixed(2)} ${invoice.currency}`);
      console.log(`      Description: ${invoice.description}`);
      console.log(`      Date: ${new Date(invoice.date).toLocaleDateString()}`);
      console.log(`      Gateway: ${invoice.metadata?.gateway}`);
      console.log('');
    });
    
    console.log('🎉 Test completed successfully!');
    console.log('\\n📱 Next steps:');
    console.log('   1. Open http://localhost:3001');
    console.log('   2. Sign in with: huikai.work@gmail.com');
    console.log('   3. Navigate to /app/invoice');
    console.log('   4. You should see the invoices listed above');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testInvoiceWithSession();
}

module.exports = { testInvoiceWithSession };