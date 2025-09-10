const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createSimpleTestInvoices() {
  console.log('🔧 Creating simple test Stripe invoices...');
  
  try {
    // 1. 创建测试客户
    const customer = await stripe.customers.create({
      email: 'invoice-test@example.com',
      name: 'Invoice Test User',
      description: 'Test customer for invoice display'
    });
    console.log(`✅ Created customer: ${customer.id}`);
    
    // 2. 创建几种不同状态的invoices
    const invoiceConfigs = [
      {
        description: 'Legnext Pro Monthly Plan - December 2024',
        amount: 2900,
        status: 'finalized', // 将会显示为pending/open
        metadata: {
          planName: 'pro',
          credits: '5000',
          gateway: 'stripe'
        }
      },
      {
        description: 'Legnext Pro Annual Plan - Special Offer',
        amount: 29000,
        status: 'draft',
        metadata: {
          planName: 'pro-annual',
          credits: '60000',
          gateway: 'stripe'
        }
      },
      {
        description: 'Additional API Credits - Extra Pack',
        amount: 1500,
        status: 'finalized',
        metadata: {
          planName: 'credits-pack',
          credits: '2500',
          gateway: 'stripe'
        }
      }
    ];
    
    const createdInvoices = [];
    
    for (let i = 0; i < invoiceConfigs.length; i++) {
      const config = invoiceConfigs[i];
      
      // 创建invoice
      const invoice = await stripe.invoices.create({
        customer: customer.id,
        description: config.description,
        metadata: config.metadata,
        collection_method: 'send_invoice',
        days_until_due: 30
      });
      
      // 添加invoice item
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: config.amount,
        currency: 'usd',
        description: config.description,
        metadata: config.metadata
      });
      
      // 根据配置设置invoice状态
      if (config.status === 'finalized') {
        await stripe.invoices.finalizeInvoice(invoice.id);
        console.log(`✅ Created finalized invoice: ${invoice.id} - ${config.description}`);
      } else {
        console.log(`📝 Created draft invoice: ${invoice.id} - ${config.description}`);
      }
      
      createdInvoices.push(invoice);
    }
    
    // 3. 创建一个已支付的invoice（通过模拟支付）
    console.log('\\n💳 Creating paid invoice...');
    
    // 为客户附加支付方式
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });
    
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    });
    
    // 设置为默认支付方式
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });
    
    // 创建已支付的invoice
    const paidInvoice = await stripe.invoices.create({
      customer: customer.id,
      description: 'Legnext Pro - November 2024 (Paid)',
      metadata: {
        planName: 'pro',
        credits: '5000',
        gateway: 'stripe'
      },
      collection_method: 'charge_automatically'
    });
    
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: paidInvoice.id,
      amount: 2900,
      currency: 'usd',
      description: 'Legnext Pro - November 2024 (Paid)',
      metadata: {
        planName: 'pro',
        credits: '5000',
        gateway: 'stripe'
      }
    });
    
    await stripe.invoices.finalizeInvoice(paidInvoice.id);
    await stripe.invoices.pay(paidInvoice.id);
    
    console.log(`✅ Created paid invoice: ${paidInvoice.id}`);
    
    console.log('\\n🎉 Test invoices created successfully!');
    console.log(`👤 Test Customer: ${customer.email} (${customer.id})`);
    console.log('\\n📊 Created invoice types:');
    console.log('  • 1 Paid invoice ($29.00)');
    console.log('  • 2 Open/Pending invoices ($29.00, $15.00)');
    console.log('  • 1 Draft invoice ($290.00)');
    console.log('\\n💡 To test the invoice page:');
    console.log('  1. Start your dev server: npm run dev');
    console.log('  2. Sign in with the email: invoice-test@example.com');
    console.log('  3. Make sure this email has a Stripe customer record in your database');
    console.log('  4. Visit: http://localhost:3001/app/invoice');
    
    return { customer, invoices: [...createdInvoices, paidInvoice] };
    
  } catch (error) {
    console.error('❌ Error creating test invoices:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.log('🔐 Please check your STRIPE_SECRET_KEY in .env.local');
    }
    throw error;
  }
}

async function createDatabaseCustomer(stripeCustomerId) {
  console.log('\\n🔗 Creating database customer record...');
  console.log('⚠️  Manual step required:');
  console.log(`   Run this SQL in your database:`);
  console.log(`   INSERT INTO "Customer" ("userId", "stripeCustomerId", "createdAt", "updatedAt")`);
  console.log(`   VALUES ('your-user-id', '${stripeCustomerId}', NOW(), NOW());`);
  console.log(`\\n   Or update existing user's customer record with Stripe ID: ${stripeCustomerId}`);
}

// 运行脚本
async function main() {
  console.log('🧪 Simple Stripe Invoice Testing Script');
  console.log('=====================================\\n');
  
  try {
    const result = await createSimpleTestInvoices();
    await createDatabaseCustomer(result.customer.id);
    
    console.log('\\n✨ All done! Your test invoices are ready.');
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createSimpleTestInvoices };