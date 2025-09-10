// 测试Stripe webhook处理脚本
const crypto = require('crypto');

// 模拟Stripe webhook事件数据
const mockWebhookEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2023-08-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_subscription_session',
      object: 'checkout.session',
      mode: 'subscription',
      customer: 'cus_test_customer',
      client_reference_id: 'test-user-id', // 替换为实际用户ID
      customer_details: {
        email: 'test@example.com' // 替换为实际用户邮箱
      },
      subscription: 'sub_test_subscription',
      payment_status: 'paid',
      status: 'complete'
    }
  },
  type: 'checkout.session.completed'
};

// 模拟webhook签名
function createWebhookSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

async function testWebhook() {
  console.log('🧪 Testing Stripe webhook processing...\n');
  
  // 请替换为你的实际值
  const WEBHOOK_URL = 'http://localhost:3001/api/webhooks/stripe';
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
  
  const payload = JSON.stringify(mockWebhookEvent);
  const signature = createWebhookSignature(mockWebhookEvent, WEBHOOK_SECRET);
  
  console.log('📤 Sending test webhook event:');
  console.log('Event Type:', mockWebhookEvent.type);
  console.log('Customer ID:', mockWebhookEvent.data.object.customer);
  console.log('User ID:', mockWebhookEvent.data.object.client_reference_id);
  console.log('Email:', mockWebhookEvent.data.object.customer_details.email);
  console.log('Subscription ID:', mockWebhookEvent.data.object.subscription);
  console.log('Signature:', signature.substring(0, 50) + '...\n');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: payload
    });
    
    const result = await response.text();
    
    console.log('📥 Webhook response:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('\n✅ Webhook processed successfully!');
      console.log('Check your server console for detailed debug logs with [DEBUG], [BACKEND-SYNC], [BACKEND-API] prefixes');
    } else {
      console.log('\n❌ Webhook processing failed');
    }
    
  } catch (error) {
    console.error('\n💥 Error calling webhook:', error.message);
    console.log('Make sure your server is running on http://localhost:3001');
  }
}

// 使用说明
if (process.argv.includes('--help')) {
  console.log(`
测试 Stripe Webhook 脚本使用说明:

1. 确保开发服务器正在运行:
   npm run dev

2. 运行测试脚本:
   node test-webhook.js

3. 观察服务器控制台输出:
   - 查找 [DEBUG] 标签的详细调试信息
   - 查找 [BACKEND-SYNC] 标签的后端同步信息  
   - 查找 [BACKEND-API] 标签的后端API调用信息

4. 自定义测试数据:
   编辑脚本中的 mockWebhookEvent 对象
   - client_reference_id: 替换为实际的用户ID
   - customer_details.email: 替换为实际的用户邮箱

环境变量:
   STRIPE_WEBHOOK_SECRET: Stripe webhook密钥
  `);
  process.exit(0);
}

// 检查Node.js版本
const nodeVersion = process.version;
if (parseInt(nodeVersion.split('.')[0].substring(1)) < 18) {
  console.error('❌ 此脚本需要 Node.js 18+ 版本 (当前版本: ' + nodeVersion + ')');
  process.exit(1);
}

testWebhook();