#!/usr/bin/env node

/**
 * Square Webhook Test Script
 * 
 * This script simulates a Square payment.created webhook event
 * to test the webhook processing logic locally.
 */

const crypto = require('crypto');

// Sample Square payment.created webhook payload
const webhookPayload = {
  "merchant_id": "6SSW7HV8K2ST5",
  "type": "payment.created",
  "event_id": "test-event-" + crypto.randomUUID(),
  "created_at": new Date().toISOString(),
  "data": {
    "type": "payment",
    "id": "test-payment-" + crypto.randomUUID(),
    "object": {
      "payment": {
        "id": "test-payment-" + crypto.randomUUID(),
        "created_at": new Date().toISOString(),
        "updated_at": new Date().toISOString(),
        "amount_money": {
          "amount": 1200, // $12.00 in cents
          "currency": "USD"
        },
        "status": "APPROVED",
        "source_type": "CARD",
        "note": "User ID: test-user-123 - Pro Plan subscription",
        "buyer_email_address": "test@example.com",
        "order_id": "order-" + crypto.randomUUID(),
        "card_details": {
          "status": "AUTHORIZED",
          "card": {
            "card_brand": "MASTERCARD",
            "last_4": "1234",
            "exp_month": 12,
            "exp_year": 2025,
            "card_type": "CREDIT"
          },
          "entry_method": "KEYED",
          "statement_description": "SQ *PNGTUBER MAKER"
        }
      }
    }
  }
};

// Generate webhook signature (Square format)
function generateSquareSignature(payload, secret) {
  const webhookUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL || 'https://pngtubermaker.com/api/webhooks/square';
  const stringToSign = webhookUrl + JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(stringToSign, 'utf8').digest('base64');
}

async function testWebhook() {
  const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('❌ SQUARE_WEBHOOK_SECRET environment variable is required');
    process.exit(1);
  }

  const payloadString = JSON.stringify(webhookPayload, null, 2);
  const signature = generateSquareSignature(webhookPayload, webhookSecret);
  
  console.log('🧪 Testing Square webhook with payload:');
  console.log('=====================================');
  console.log(payloadString);
  console.log('=====================================');
  console.log('Generated signature:', signature.substring(0, 20) + '...');
  
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/square', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Square-Hmacsha256-Signature': signature,
        'User-Agent': 'Square-Node-SDK/43.0.0 (webhook test)'
      },
      body: JSON.stringify(webhookPayload)
    });
    
    const result = await response.text();
    
    console.log('\n📊 Webhook Response:');
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('\n✅ Webhook test completed successfully!');
      console.log('Check your server logs for detailed processing information.');
    } else {
      console.log('\n❌ Webhook test failed!');
      console.log('Check the error response above.');
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    console.log('\n💡 Make sure your development server is running on http://localhost:3000');
    console.log('   Run: npm run dev');
  }
}

// Command line interface
if (require.main === module) {
  console.log('🔔 Square Webhook Test Script');
  console.log('==============================');
  
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node webhook-test.js');
    console.log('');
    console.log('Environment variables required:');
    console.log('  SQUARE_WEBHOOK_SECRET - Your Square webhook signature key');
    console.log('');
    console.log('Make sure your development server is running:');
    console.log('  npm run dev');
    console.log('');
    console.log('This script will send a test payment.created webhook to:');
    console.log('  http://localhost:3000/api/webhooks/square');
    process.exit(0);
  }
  
  testWebhook().catch(console.error);
}

module.exports = { testWebhook, webhookPayload };