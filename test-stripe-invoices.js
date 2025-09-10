const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createTestInvoices() {
  console.log('🔧 Creating test Stripe invoices...');
  
  try {
    // 1. 创建或获取测试客户
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: 'test@example.com',
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log(`👤 Using existing customer: ${customer.id}`);
    } else {
      customer = await stripe.customers.create({
        email: 'test@example.com',
        name: 'Test User',
        description: 'Test customer for invoice demo'
      });
      console.log(`✅ Created new customer: ${customer.id}`);
    }
    
    // 2. 创建产品和价格（如果不存在）
    let product;
    const existingProducts = await stripe.products.list({
      limit: 1,
      active: true
    });
    
    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(`📦 Using existing product: ${product.id}`);
    } else {
      product = await stripe.products.create({
        name: 'Legnext Pro Plan',
        description: 'Monthly subscription with 5,000 API calls',
        metadata: {
          planName: 'pro',
          credits: '5000'
        }
      });
      console.log(`✅ Created product: ${product.id}`);
    }
    
    // 获取或创建价格
    let price;
    const existingPrices = await stripe.prices.list({
      product: product.id,
      limit: 1
    });
    
    if (existingPrices.data.length > 0) {
      price = existingPrices.data[0];
      console.log(`💰 Using existing price: ${price.id}`);
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: 2900, // $29.00
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          planName: 'pro',
          credits: '5000'
        }
      });
      console.log(`✅ Created price: ${price.id}`);
    }
    
    // 3. 创建几个测试invoice
    const invoiceData = [
      {
        description: 'Legnext Pro Monthly Subscription',
        amount: 2900,
        metadata: {
          planName: 'pro',
          credits: '5000',
          gateway: 'stripe'
        }
      },
      {
        description: 'Legnext Pro Annual Subscription',
        amount: 29000,
        metadata: {
          planName: 'pro',
          credits: '60000',
          gateway: 'stripe'
        }
      },
      {
        description: 'Additional API Credits Package',
        amount: 1500,
        metadata: {
          planName: 'credits',
          credits: '2500',
          gateway: 'stripe'
        }
      }
    ];
    
    for (let i = 0; i < invoiceData.length; i++) {
      const data = invoiceData[i];
      
      // 创建invoice
      const invoice = await stripe.invoices.create({
        customer: customer.id,
        description: data.description,
        metadata: data.metadata,
        collection_method: 'charge_automatically'
      });
      
      // 添加invoice item
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: data.amount,
        currency: 'usd',
        description: data.description,
        metadata: data.metadata
      });
      
      // 根据索引决定invoice状态
      if (i === 0) {
        // 第一个invoice标记为已付费
        await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.pay(invoice.id, {
          payment_method: 'pm_card_visa' // 测试支付方式
        });
        console.log(`✅ Created and paid invoice: ${invoice.id} - ${data.description}`);
      } else if (i === 1) {
        // 第二个invoice保持为draft状态
        console.log(`📝 Created draft invoice: ${invoice.id} - ${data.description}`);
      } else {
        // 第三个invoice finalize但不支付
        await stripe.invoices.finalizeInvoice(invoice.id);
        console.log(`⏳ Created pending invoice: ${invoice.id} - ${data.description}`);
      }
    }
    
    console.log('\\n🎉 Test invoices created successfully!');
    console.log('💡 You can now view them at: http://localhost:3001/app/invoice');
    console.log(`👤 Customer ID: ${customer.id}`);
    console.log('\\n📊 Invoice statuses:');
    console.log('  • 1 Paid invoice (Pro Monthly)');
    console.log('  • 1 Draft invoice (Pro Annual)');  
    console.log('  • 1 Open/Pending invoice (Credits Package)');
    
  } catch (error) {
    console.error('❌ Error creating test invoices:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.log('🔐 Please check your STRIPE_SECRET_KEY in .env.local');
    }
  }
}

async function listExistingInvoices() {
  console.log('\\n📋 Existing invoices in Stripe:');
  try {
    const invoices = await stripe.invoices.list({
      limit: 10,
      expand: ['data.customer']
    });
    
    if (invoices.data.length === 0) {
      console.log('  No invoices found.');
      return;
    }
    
    invoices.data.forEach((invoice, index) => {
      console.log(`  ${index + 1}. ${invoice.id} - ${invoice.status} - $${(invoice.total / 100).toFixed(2)} - ${invoice.customer?.email || 'No email'}`);
    });
  } catch (error) {
    console.error('❌ Error listing invoices:', error.message);
  }
}

// 运行脚本
async function main() {
  console.log('🧪 Stripe Invoice Testing Script');
  console.log('================================\\n');
  
  // 先列出现有的invoices
  await listExistingInvoices();
  
  // 创建测试invoices
  await createTestInvoices();
  
  // 再次列出invoices确认创建成功
  await listExistingInvoices();
}

if (require.main === module) {
  main();
}

module.exports = { createTestInvoices, listExistingInvoices };