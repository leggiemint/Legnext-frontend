import { stripe } from '@/libs/stripe-client';
import { prisma } from '@/libs/prisma';
import { log } from '@/libs/logger';

/**
 * Stripe配置切换时的数据处理工具
 * 解决多账户环境下的数据不一致问题
 */

export interface StripeCustomerValidationResult {
  isValid: boolean;
  customerId: string | null;
  needsRecreation: boolean;
  error?: string;
}

/**
 * 验证Stripe客户是否存在且有效
 */
export async function validateStripeCustomer(customerId: string): Promise<StripeCustomerValidationResult> {
  if (!customerId) {
    return {
      isValid: false,
      customerId: null,
      needsRecreation: true,
      error: 'Customer ID is empty'
    };
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);

    // 检查客户是否被删除
    if ('deleted' in customer && customer.deleted) {
      return {
        isValid: false,
        customerId: null,
        needsRecreation: true,
        error: 'Customer is deleted'
      };
    }

    return {
      isValid: true,
      customerId: customer.id,
      needsRecreation: false
    };
  } catch (error: any) {
    log.warn('Stripe customer validation failed', { customerId, error: error.message });

    if (error?.code === 'resource_missing') {
      return {
        isValid: false,
        customerId: null,
        needsRecreation: true,
        error: 'Customer not found in current Stripe account'
      };
    }

    // 其他错误（网络问题等）
    return {
      isValid: false,
      customerId,
      needsRecreation: false,
      error: error.message
    };
  }
}

/**
 * 强化版本的getOrCreateStripeCustomer
 * 支持Stripe配置切换时的自动修复
 */
export async function getOrCreateStripeCustomerResilient(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  try {
    // 1. 从数据库获取现有客户ID
    const paymentCustomer = await prisma.paymentCustomer.findUnique({
      where: { userId }
    });

    // 2. 如果有客户ID，验证其有效性
    if (paymentCustomer?.stripeCustomerId) {
      const validation = await validateStripeCustomer(paymentCustomer.stripeCustomerId);

      if (validation.isValid) {
        log.info('Existing Stripe customer is valid', {
          userId,
          customerId: validation.customerId
        });
        return validation.customerId!;
      }

      // 客户ID无效，需要重新创建
      log.warn('Existing Stripe customer is invalid, will recreate', {
        userId,
        oldCustomerId: paymentCustomer.stripeCustomerId,
        error: validation.error
      });
    }

    // 3. 尝试通过邮箱在当前Stripe账户中查找现有客户
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    let customerId: string;

    if (existingCustomers.data.length > 0) {
      // 找到现有客户，更新metadata
      const existingCustomer = existingCustomers.data[0];
      await stripe.customers.update(existingCustomer.id, {
        metadata: {
          userId,
          migrated_at: new Date().toISOString(),
          migration_reason: 'stripe_config_switch'
        }
      });

      customerId = existingCustomer.id;
      log.info('Found existing Stripe customer by email', {
        userId,
        email,
        customerId
      });
    } else {
      // 创建新客户
      const newCustomer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          created_reason: 'stripe_config_switch_recreation',
          created_at: new Date().toISOString()
        }
      });

      customerId = newCustomer.id;
      log.info('Created new Stripe customer', {
        userId,
        email,
        customerId
      });
    }

    // 4. 更新数据库中的客户ID
    await prisma.paymentCustomer.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: customerId
      },
      update: {
        stripeCustomerId: customerId,
        updatedAt: new Date()
      }
    });

    log.info('Updated database with new Stripe customer ID', {
      userId,
      customerId
    });

    return customerId;

  } catch (error) {
    log.error('Error in getOrCreateStripeCustomerResilient', {
      userId,
      email,
      error
    });
    throw error;
  }
}

/**
 * 批量清理无效的Stripe客户ID
 * 用于一次性修复所有无效数据
 */
export async function cleanupInvalidStripeCustomers(): Promise<{
  total: number;
  fixed: number;
  failed: number;
  errors: Array<{ userId: string; error: string }>;
}> {
  const result = {
    total: 0,
    fixed: 0,
    failed: 0,
    errors: [] as Array<{ userId: string; error: string }>
  };

  try {
    // 获取所有有Stripe客户ID的记录并从UserProfile获取用户信息
    const paymentCustomers = await prisma.paymentCustomer.findMany({
      where: {
        stripeCustomerId: {
          not: null
        }
      }
    });

    result.total = paymentCustomers.length;
    log.info('Starting batch cleanup of Stripe customers', { total: result.total });

    for (const paymentCustomer of paymentCustomers) {
      if (!paymentCustomer.stripeCustomerId) continue;

      try {
        const validation = await validateStripeCustomer(paymentCustomer.stripeCustomerId);

        if (!validation.isValid && validation.needsRecreation) {
          // 需要重新创建客户 - 从UserProfile获取用户信息
          const profile = await prisma.userProfile.findUnique({
            where: { userId: paymentCustomer.userId },
            select: { email: true, name: true }
          });

          if (!profile?.email) {
            result.errors.push({
              userId: paymentCustomer.userId,
              error: 'No email found in profile'
            });
            result.failed++;
            continue;
          }

          const newCustomerId = await getOrCreateStripeCustomerResilient(
            paymentCustomer.userId,
            profile.email,
            profile.name || undefined
          );

          log.info('Fixed invalid Stripe customer', {
            userId: paymentCustomer.userId,
            oldCustomerId: paymentCustomer.stripeCustomerId,
            newCustomerId
          });

          result.fixed++;
        }
      } catch (error: any) {
        result.errors.push({
          userId: paymentCustomer.userId,
          error: error.message
        });
        result.failed++;
        log.error('Failed to fix Stripe customer', {
          userId: paymentCustomer.userId,
          error
        });
      }
    }

    log.info('Batch cleanup completed', result);
    return result;

  } catch (error) {
    log.error('Error during batch cleanup', { error });
    throw error;
  }
}

/**
 * 为API端点提供的安全包装器
 * 确保Stripe操作前客户有效性
 */
export async function withValidStripeCustomer<T>(
  userId: string,
  email: string,
  operation: (customerId: string) => Promise<T>
): Promise<T> {
  try {
    // 确保有有效的Stripe客户
    const customerId = await getOrCreateStripeCustomerResilient(
      userId,
      email
    );

    // 执行操作
    return await operation(customerId);

  } catch (error: any) {
    log.error('Error in withValidStripeCustomer', {
      userId,
      email,
      error: error.message
    });

    // 如果仍然是customer相关错误，抛出更友好的错误
    if (error?.code === 'resource_missing') {
      throw new Error('Unable to process payment request. Please try again or contact support.');
    }

    throw error;
  }
}