/**
 * Stripe配置验证工具
 * 用于验证Stripe环境配置的有效性
 */

import { stripe } from '@/libs/stripe-client';
import { log } from '@/libs/logger';

export interface StripeConfigValidationResult {
  isValid: boolean;
  accountId?: string;
  errors: string[];
  warnings: string[];
}

/**
 * 验证当前Stripe配置的有效性
 */
export async function validateStripeConfig(): Promise<StripeConfigValidationResult> {
  const result: StripeConfigValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // 1. 检查必需的环境变量
  if (!process.env.STRIPE_SECRET_KEY) {
    result.errors.push('STRIPE_SECRET_KEY environment variable is missing');
    result.isValid = false;
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    result.warnings.push('STRIPE_WEBHOOK_SECRET is missing - webhooks will not work');
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
    result.warnings.push('NEXT_PUBLIC_STRIPE_PRO_PRICE_ID is missing - subscriptions will not work');
  }

  // 2. 验证Stripe API连接
  try {
    const account = await stripe.accounts.retrieve();
    result.accountId = account.id;

    log.info('Stripe account validation successful', {
      accountId: account.id,
      country: account.country,
      defaultCurrency: account.default_currency,
      type: account.type
    });

    // 检查账户状态
    if (!account.charges_enabled) {
      result.warnings.push('Stripe account charges are disabled');
    }

    if (!account.payouts_enabled) {
      result.warnings.push('Stripe account payouts are disabled');
    }

  } catch (error: any) {
    result.errors.push(`Failed to connect to Stripe API: ${error.message}`);
    result.isValid = false;
  }

  // 3. 验证价格对象（如果配置了）
  if (process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
    try {
      const price = await stripe.prices.retrieve(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID);

      if (!price.active) {
        result.warnings.push('Configured Stripe price is inactive');
      }

      if (price.type !== 'recurring') {
        result.warnings.push('Configured Stripe price is not recurring (not suitable for subscriptions)');
      }

      log.info('Stripe price validation successful', {
        priceId: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        active: price.active
      });

    } catch (error: any) {
      result.errors.push(`Invalid Stripe price ID: ${error.message}`);
      result.isValid = false;
    }
  }

  return result;
}

/**
 * 打印Stripe配置状态报告
 */
export async function printStripeConfigReport(): Promise<void> {
  console.log('\n🔍 Stripe Configuration Validation Report');
  console.log('==========================================');

  const validation = await validateStripeConfig();

  if (validation.isValid) {
    console.log('✅ Stripe configuration is valid');
    if (validation.accountId) {
      console.log(`📊 Connected to Stripe account: ${validation.accountId}`);
    }
  } else {
    console.log('❌ Stripe configuration has errors');
  }

  if (validation.errors.length > 0) {
    console.log('\n❌ Errors:');
    validation.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }

  console.log('\n💡 Environment Variables Status:');
  console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '⚠️  Missing'}`);
  console.log(`   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: ${process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ? '✅ Set' : '⚠️  Missing'}`);

  console.log('\n==========================================\n');
}