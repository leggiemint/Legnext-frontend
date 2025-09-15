import { prisma } from '@/libs/prisma';
import { backendApiClient } from '@/libs/backend-api-client';

export interface UserWithProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  profile?: {
    backendAccountId: number | null;
    initApiKey?: string | null;
    plan: string;
    preferences: any;
  } | null;
  paymentCustomer?: {
    stripeCustomerId: string | null;
  } | null;
}

/**
 * 获取用户完整信息（包含profile和payment信息）
 * 纯JWT策略下，直接从UserProfile表获取数据
 */
export async function getUserWithProfile(userId: string): Promise<UserWithProfile | null> {
  try {
    const [profile, paymentCustomer] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.paymentCustomer.findUnique({ where: { userId } }).catch((): null => null)
    ]);

    

    const userWithProfile = {
      id: userId,
      email: profile.email,
      name: profile.name,
      image: profile.image,
      emailVerified: profile.emailVerified,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      profile: {
        ...profile,
        initApiKey: profile.initApiKey || (profile.preferences as any)?.initApiKey || null
      },
      paymentCustomer
    };

    return userWithProfile as any;
  } catch (error: any) {
    console.error(`Error fetching user profile:`, error);
    return null;
  }
}

/**
 * 创建用户profile并关联backend账户
 */
export async function createUserProfileWithBackend(
  userId: string,
  email: string,
  plan: 'free' | 'pro' = 'free',
  name?: string,
  image?: string
): Promise<UserWithProfile | null> {
  try {
    const backendPlan = plan === 'free' ? 'hobbyist' : 'developer';
    let backendAccount: any;
    
    try {
      const accountParams = {
        name: `legnexta_${email}`,
        plan: backendPlan as 'hobbyist' | 'developer',
      };
      
      const backendResponse = await backendApiClient.createAccount(accountParams);

      if (backendResponse.code !== 200) {
        throw new Error(`Backend account creation failed: ${backendResponse.message}`);
      }

      backendAccount = backendResponse.data;
    } catch (createError: any) {
      if (createError.message.includes('duplicate key value violates unique constraint')) {
        // 创建一个没有backendAccountId的profile，用户稍后可以链接现有账户
        const initApiKey: string | null = null;

        try {
          await prisma.userProfile.create({
            data: {
              userId,
              email,
              name,
              image,
              backendAccountId: null,
              initApiKey,
              plan,
              preferences: {
                needsBackendLinking: true,
                backendAccountEmail: email,
                accountExistsInBackend: true
              },
            },
          });
        } catch (dbError) {
          await prisma.userProfile.create({
            data: {
              userId,
              email,
              name,
              image,
              backendAccountId: null,
              plan,
              preferences: {
                needsBackendLinking: true,
                backendAccountEmail: email,
                accountExistsInBackend: true,
                initApiKey: null
              },
            },
          });
        }

        return await getUserWithProfile(userId);
      } else {
        throw createError;
      }
    }
    
    const initApiKey = backendAccount.api_keys?.[0]?.value || null;
    
    try {
      await prisma.userProfile.create({
        data: {
          userId,
          email,
          name,
          image,
          backendAccountId: backendAccount.id,
          initApiKey,
          plan,
          preferences: {},
        },
      });
    } catch (dbError) {
      await prisma.userProfile.create({
        data: {
          userId,
          email,
          name,
          image,
          backendAccountId: backendAccount.id,
          plan,
          preferences: {
            initApiKey,
          },
        },
      });
    }

    // 创建welcome credit pack
    try {
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + 31);

      await backendApiClient.createCreditPack(backendAccount.id, {
        capacity: 200,
        description: 'Welcome credit pack for new user (200 credits, 31 days)',
        expired_at: expiredAt.toISOString(),
      });
    } catch (creditPackError) {
      // 不抛出错误，因为用户账户已经创建成功
    }

    // 获取并存储init API key
    try {
      const apiKeysResponse = await backendApiClient.getAccountApiKeys(backendAccount.id);
      
      if (apiKeysResponse.code === 200 && apiKeysResponse.data?.length > 0) {
        const initApiKey = apiKeysResponse.data[0].value;
        await prisma.userProfile.update({
          where: { userId },
          data: { initApiKey }
        });
      }
    } catch (apiKeyError) {
      // 不抛出错误，因为用户账户已经创建成功
    }

    return await getUserWithProfile(userId);
  } catch (error) {
    console.error('Error creating user profile with backend:', error);
    return null;
  }
}

/**
 * 确保用户有profile，如果没有则创建
 */
export async function ensureUserProfile(userId: string, email: string, name?: string, image?: string): Promise<UserWithProfile | null> {
  const user = await getUserWithProfile(userId);
  
  if (!user?.profile) {
    return await createUserProfileWithBackend(userId, email, 'free', name, image);
  }
  
  return user;
}

/**
 * 使用API密钥链接现有的backend账户
 */
export async function linkExistingBackendAccount(
  userId: string,
  userApiKey: string
): Promise<UserWithProfile | null> {
  try {
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { email: true, name: true, image: true }
    });

    if (!existingProfile || !existingProfile.email) {
      throw new Error('UserProfile not found or missing email');
    }
    
    const accountResponse = await backendApiClient.getCurrentAccountInfo(userApiKey);
    
    if (accountResponse.code !== 200) {
      throw new Error(`Failed to get backend account info: ${accountResponse.message}`);
    }

    const backendAccount = accountResponse.data;
    const frontendPlan = backendAccount.plan === 'developer' ? 'pro' : 'free';

    try {
      await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          email: existingProfile.email,
          name: existingProfile.name,
          image: existingProfile.image,
          backendAccountId: backendAccount.id,
          initApiKey: userApiKey,
          plan: frontendPlan,
          preferences: {
            linkedAt: new Date().toISOString(),
            linkedMethod: 'api_key'
          },
        },
        update: {
          backendAccountId: backendAccount.id,
          initApiKey: userApiKey,
          plan: frontendPlan,
          preferences: {
            linkedAt: new Date().toISOString(),
            linkedMethod: 'api_key'
          },
        },
      });
    } catch (dbError) {
      await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          email: existingProfile.email,
          name: existingProfile.name,
          image: existingProfile.image,
          backendAccountId: backendAccount.id,
          plan: frontendPlan,
          preferences: {
            initApiKey: userApiKey,
            linkedAt: new Date().toISOString(),
            linkedMethod: 'api_key'
          },
        },
        update: {
          backendAccountId: backendAccount.id,
          plan: frontendPlan,
          preferences: {
            initApiKey: userApiKey,
            linkedAt: new Date().toISOString(),
            linkedMethod: 'api_key'
          },
        },
      });
    }

    return await getUserWithProfile(userId);

  } catch (error) {
    console.error('Error linking backend account:', error);
    return null;
  }
}

/**
 * 更新用户plan（同时更新backend系统）
 */
export async function updateUserPlan(userId: string, newPlan: 'free' | 'pro'): Promise<boolean> {
  try {
    const user = await getUserWithProfile(userId);
    if (!user?.profile?.backendAccountId) {
      throw new Error('User has no backend account');
    }

    // 1. 更新backend系统
    const backendPlan = newPlan === 'free' ? 'hobbyist' : 'developer';
    const backendResponse = await backendApiClient.updateAccountPlan(
      user.profile.backendAccountId,
      backendPlan
    );

    if (backendResponse.code !== 200) {
      throw new Error(`Backend plan update failed: ${backendResponse.message}`);
    }

    // 2. 更新前端数据库
    await prisma.userProfile.update({
      where: { userId },
      data: { plan: newPlan },
    });

    return true;
  } catch (error) {
    console.error('Error updating user plan:', error);
    return false;
  }
}

/**
 * 获取或创建Stripe客户
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string | null> {
  let paymentCustomer = await prisma.paymentCustomer.findUnique({
    where: { userId },
  });

  if (!paymentCustomer) {
    paymentCustomer = await prisma.paymentCustomer.create({
      data: { userId },
    });
  }

  return paymentCustomer.stripeCustomerId;
}

/**
 * 更新Stripe客户ID
 */
export async function updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
  await prisma.paymentCustomer.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId,
    },
    update: {
      stripeCustomerId,
    },
  });
}