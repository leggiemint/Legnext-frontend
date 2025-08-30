// Simple script to test webhook connectivity
// Usage: node scripts/test-webhook.js

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function testWebhookEndpoint() {
  console.log('Testing webhook endpoints...\n');
  
  // Test basic connectivity
  try {
    const testResponse = await fetch(`${baseUrl}/api/webhook/stripe/test`);
    const testResult = await testResponse.json();
    console.log('✅ Test endpoint reachable:', testResult);
  } catch (error) {
    console.log('❌ Test endpoint failed:', error.message);
  }

  // Test POST to test endpoint
  try {
    const testPostResponse = await fetch(`${baseUrl}/api/webhook/stripe/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true })
    });
    const testPostResult = await testPostResponse.json();
    console.log('✅ Test POST endpoint works:', testPostResult);
  } catch (error) {
    console.log('❌ Test POST endpoint failed:', error.message);
  }

  // Note: Testing actual webhook endpoint requires Stripe signature
  console.log('\n⚠️  Skipping webhook test - requires Stripe signature');
  console.log('To test webhooks, use real Stripe payments or Stripe CLI events');
}

testWebhookEndpoint();