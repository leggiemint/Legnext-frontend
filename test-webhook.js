// 简单的webhook测试脚本
const https = require('http');

console.log('Testing webhook endpoint...');

const postData = JSON.stringify({
  type: 'checkout.session.completed',
  id: 'evt_test',
  data: {
    object: {
      id: 'cs_test',
      customer: 'cus_test',
      mode: 'subscription',
      metadata: {},
      line_items: {
        data: [{
          price: {
            id: process.env.STRIPE_PRO_PRICE_ID || 'price_1S1k2eKyeXh3bz3dL2jbl2VM'
          }
        }]
      }
    }
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhook/stripe',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  }
};

const req = https.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`响应体: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('测试完成');
  });
});

req.on('error', (e) => {
  console.error(`请求遇到问题: ${e.message}`);
});

req.write(postData);
req.end();
