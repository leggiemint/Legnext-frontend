const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function reactivateForTesting() {
  console.log('🔄 Reactivating subscription for testing purposes...');
  
  try {
    const subscription = await stripe.subscriptions.update('sub_1S5uNyKyeXh3bz3d4eY8Zw8h', {
      cancel_at_period_end: false,
      metadata: {
        reactivated_for_testing: new Date().toISOString()
      }
    });
    
    console.log('✅ Subscription reactivated!');
    console.log(`🔄 Cancel at period end: ${subscription.cancel_at_period_end}`);
    console.log('📱 Now you can test the cancel subscription button again');
    console.log('💡 The new success message should show the correct cancellation date');
    
  } catch (error) {
    console.error('❌ Failed to reactivate:', error.message);
  }
}

if (require.main === module) {
  reactivateForTesting();
}

module.exports = { reactivateForTesting };