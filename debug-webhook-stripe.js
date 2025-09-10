#!/usr/bin/env node

/**
 * Stripe Webhook Debug Script
 * 
 * This script helps debug Stripe webhook issues by:
 * 1. Testing webhook endpoint connectivity
 * 2. Checking webhook event processing
 * 3. Verifying database updates
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWebhookStatus() {
  console.log('🔍 Checking Stripe webhook status...\n');

  try {
    // 1. Check recent webhook events in database
    console.log('1. Recent webhook events:');
    const recentEvents = await prisma.webhookEvent.findMany({
      where: {
        provider: 'stripe'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    if (recentEvents.length === 0) {
      console.log('   ❌ No webhook events found in database');
      console.log('   💡 This suggests webhooks are not reaching your application');
    } else {
      recentEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. Event: ${event.eventType}`);
        console.log(`      ID: ${event.eventId}`);
        console.log(`      Processed: ${event.processed ? '✅' : '❌'}`);
        console.log(`      Created: ${event.createdAt.toISOString()}`);
        if (event.error) {
          console.log(`      Error: ${event.error}`);
        }
        console.log('');
      });
    }

    // 2. Check recent transactions
    console.log('2. Recent transactions:');
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        gateway: 'stripe'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3,
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (recentTransactions.length === 0) {
      console.log('   ❌ No Stripe transactions found');
    } else {
      recentTransactions.forEach((txn, index) => {
        console.log(`   ${index + 1}. Transaction: ${txn.type}`);
        console.log(`      User: ${txn.user?.profile?.user?.email || 'N/A'}`);
        console.log(`      Status: ${txn.status}`);
        console.log(`      Gateway TXN ID: ${txn.gatewayTxnId}`);
        console.log(`      Created: ${txn.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // 3. Check customers with Stripe data
    console.log('3. Customers with Stripe customer IDs:');
    const stripeCustomers = await prisma.customer.findMany({
      where: {
        stripeCustomerId: {
          not: null
        }
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      take: 3
    });

    if (stripeCustomers.length === 0) {
      console.log('   ❌ No customers with Stripe customer IDs found');
    } else {
      stripeCustomers.forEach((customer, index) => {
        const profile = customer.user?.profile;
        console.log(`   ${index + 1}. Customer: ${customer.stripeCustomerId}`);
        console.log(`      User: ${customer.user?.email || 'N/A'}`);
        console.log(`      Plan: ${profile?.plan || 'N/A'}`);
        console.log(`      Status: ${profile?.subscriptionStatus || 'N/A'}`);
        console.log(`      Credits: ${profile?.apiCalls || 0}`);
        console.log('');
      });
    }

    // 4. Environment check
    console.log('4. Environment configuration:');
    console.log(`   STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Not set'}`);
    console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`   Database URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
    console.log('');

    console.log('📋 Summary:');
    if (recentEvents.length === 0) {
      console.log('   🔴 Issue: No webhook events received');
      console.log('   💡 Solutions:');
      console.log('      1. Ensure Stripe CLI is forwarding to correct port (3002)');
      console.log('      2. Command: stripe listen --forward-to localhost:3002/api/webhooks/stripe');
      console.log('      3. Check Stripe dashboard webhook configuration');
      console.log('      4. Verify webhook endpoint URL is accessible');
    } else {
      const hasUnprocessed = recentEvents.some(e => !e.processed);
      if (hasUnprocessed) {
        console.log('   🟡 Issue: Some webhook events failed to process');
        console.log('   💡 Check the error messages in webhook events above');
      } else {
        console.log('   🟢 Webhooks appear to be working correctly');
      }
    }

  } catch (error) {
    console.error('❌ Error checking webhook status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkWebhookStatus().catch(console.error);