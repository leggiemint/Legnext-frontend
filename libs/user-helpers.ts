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
    // 纯JWT策略下，直接从UserProfile表获取数据
    const [profile, paymentCustomer] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.paymentCustomer.findUnique({ where: { userId } }).catch((): null => null)
    ]);

    if (!profile) {
      return null;
    }

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
  console.log(`🚀 [createUserProfileWithBackend] Starting backend account creation process:`, {
    userId,
    email,
    plan,
    timestamp: new Date().toISOString()
  });
  
  try {
    // 1. 检查backend系统中是否已存在账户
    const backendPlan = plan === 'free' ? 'hobbyist' : 'developer';
    
    console.log(`🔍 [createUserProfileWithBackend] Backend account creation parameters:`, { 
      email,
      frontendPlan: plan,
      backendPlan,
      userId
    });
    
    let backendAccount: any;
    
    
    try {
      // 直接尝试创建新账户，因为后端API不支持按邮箱查找
      console.log(`🔍 Creating new backend account for user:`, {
        userId,
        email,
        plan,
        backendPlan
      });
      const accountParams = {
        name: `legnexta_${email}`,
        plan: backendPlan as 'hobbyist' | 'developer',
      };
      
      console.log(`📤 [createUserProfileWithBackend] Backend API request details:`, {
        endpoint: 'POST /api/account',
        params: accountParams,
        timestamp: new Date().toISOString(),
        expectedNameFormat: `legnexta_${email}`,
        actualName: accountParams.name
      });
      
      const backendResponse = await backendApiClient.createAccount(accountParams);
      
      console.log(`📥 [createUserProfileWithBackend] Backend API response:`, {
        success: backendResponse.code === 200,
        code: backendResponse.code,
        message: backendResponse.message,
        hasData: !!backendResponse.data,
        accountId: backendResponse.data?.id,
        accountName: backendResponse.data?.name,
        accountPlan: backendResponse.data?.plan,
        hasApiKeys: backendResponse.data?.api_keys?.length > 0,
        hasWallet: !!backendResponse.data?.wallet,
        timestamp: new Date().toISOString()
      });

      if (backendResponse.code !== 200) {
        console.error(`❌ Backend account creation failed:`, backendResponse);
        throw new Error(`Backend account creation failed: ${backendResponse.message}`);
      }

      backendAccount = backendResponse.data;
      console.log(`🎉 [createUserProfileWithBackend] Successfully created new backend account:`, {
        step: 'backend_account_created',
        success: true,
        accountDetails: {
          id: backendAccount.id,
          name: backendAccount.name,
          plan: backendAccount.plan,
          account_group: backendAccount.account_group,
          is_enable: backendAccount.is_enable,
          type: backendAccount.type,
          max_concurrent_task_count: backendAccount.max_concurrent_task_count,
          created_at: backendAccount.created_at,
          updated_at: backendAccount.updated_at
        },
        apiKeysInfo: {
          count: backendAccount.api_keys?.length || 0,
          keys: backendAccount.api_keys?.map((key: any) => ({
            id: key.id,
            name: key.name,
            revoked: key.revoked,
            valuePreview: key.value?.substring(0, 8) + '...',
            created_at: key.created_at
          })) || []
        },
        walletInfo: backendAccount.wallet ? {
          id: backendAccount.wallet.id,
          point_remain: backendAccount.wallet.point_remain,
          point_frozen: backendAccount.wallet.point_frozen,
          point_used: backendAccount.wallet.point_used,
          auto_recharge_enabled: backendAccount.wallet.auto_recharge_enabled,
          created_at: backendAccount.wallet.created_at
        } : null,
        timestamp: new Date().toISOString()
      });
    } catch (createError: any) {
      console.log(`❌ [createUserProfileWithBackend] Backend account creation failed:`, {
        step: 'backend_account_creation_error',
        error: createError.message,
        timestamp: new Date().toISOString()
      });
      
      if (createError.message.includes('duplicate key value violates unique constraint')) {
        console.log(`🔄 [createUserProfileWithBackend] Backend account already exists - handling duplicate:`, {
          email,
          expectedAccountName: `legnexta_${email}`,
          step: 'duplicate_account_detected',
          timestamp: new Date().toISOString()
        });
        
        // 创建一个没有backendAccountId的profile，用户稍后可以链接现有账户
        const initApiKey: string | null = null; // 用户需要提供现有API密钥

        console.log(`💾 [createUserProfileWithBackend] Creating frontend profile without backend account (will need linking):`, {
          userId,
          email,
          backendAccountId: null,
          plan,
          needsLinking: true,
          step: 'create_profile_for_existing_backend',
          timestamp: new Date().toISOString()
        });

        // 在前端数据库创建profile，标记为需要链接
        try {
          await prisma.userProfile.create({
            data: {
              userId,
              email,
              name,
              image,
              backendAccountId: null, // 用户需要稍后链接
              initApiKey,
              plan,
              preferences: {
                needsBackendLinking: true,
                backendAccountEmail: email,
                accountExistsInBackend: true
              },
            },
          });
          console.log(`✅ Frontend profile created successfully (needs backend linking)`);
        } catch (dbError) {
          // Fallback if initApiKey column doesn't exist
          console.warn('⚠️ Failed to create profile with initApiKey, trying without it:', dbError);
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
          console.log(`✅ Frontend profile created successfully with preferences fallback (needs backend linking)`);
        }

        // Profile 已经创建完成，直接返回用户信息
        console.log(`🎯 Profile creation completed for existing backend account, fetching final user data...`);
        const finalUserData = await getUserWithProfile(userId);
        
        console.log(`🏁 Final user profile created (needs backend linking):`, {
          userId,
          email,
          hasProfile: !!finalUserData?.profile,
          backendAccountId: finalUserData?.profile?.backendAccountId,
          plan: finalUserData?.profile?.plan,
          needsLinking: true
        });

        return finalUserData;
      } else {
        throw createError;
      }
    }
    const initApiKey = backendAccount.api_keys?.[0]?.value || null;

    console.log(`💾 Creating frontend profile with backend account info:`, {
      userId,
      email,
      backendAccountId: backendAccount.id,
      backendAccountName: backendAccount.name,
      backendAccountPlan: backendAccount.plan,
      initApiKey: initApiKey ? initApiKey.substring(0, 8) + '...' : null,
      frontendPlan: plan,
      walletCredits: backendAccount.wallet?.point_remain || 0
    });

    // 2. 在前端数据库创建profile (支持纯JWT，无需User表外键)
    console.log(`💾 [createUserProfileWithBackend] Creating UserProfile with backend integration (JWT-only)...`, {
      userId,
      email,
      backendAccountId: backendAccount.id,
      hasInitApiKey: !!initApiKey,
      jwtOnly: true,
      timestamp: new Date().toISOString()
    });
    
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
      console.log(`✅ [createUserProfileWithBackend] Frontend profile created successfully with backend integration:`, {
        step: 'frontend_profile_created_with_backend',
        success: true,
        profileData: {
          userId,
          email,
          backendAccountId: backendAccount.id,
          plan,
          hasInitApiKey: !!initApiKey,
          hasBackendIntegration: true,
          jwtOnly: true
        },
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      // If initApiKey column doesn't exist yet, create without it
      console.warn('⚠️ Failed to create profile with initApiKey, trying without it:', dbError);
      await prisma.userProfile.create({
        data: {
          userId,
          email,
          name,
          image,
          backendAccountId: backendAccount.id,
          plan,
          preferences: {
            initApiKey, // Store in preferences as fallback
          },
        },
      });
      console.log(`✅ Frontend profile created successfully with preferences fallback`);
    }

    // 3. 为新用户创建welcome credit pack (200 credits, 31天有效期)
    try {
      console.log(`🎁 [createUserProfileWithBackend] Creating welcome credit pack for new user:`, {
        backendAccountId: backendAccount.id,
        credits: 200, // 200 credits
        validityDays: 31,
        timestamp: new Date().toISOString()
      });

      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + 31); // 31天有效期

      const creditPackResponse = await backendApiClient.createCreditPack(backendAccount.id, {
        capacity: 200, // 200 credits
        description: 'Welcome credit pack for new user (200 credits, 31 days)',
        expired_at: expiredAt.toISOString(),
      });

      if (creditPackResponse.code === 200) {
        console.log(`✅ [createUserProfileWithBackend] Welcome credit pack created successfully:`, {
          step: 'welcome_credit_pack_created',
          success: true,
          creditPackDetails: {
            id: creditPackResponse.data?.id,
            capacity: creditPackResponse.data?.capacity,
            description: creditPackResponse.data?.description,
            expired_at: creditPackResponse.data?.expired_at,
            active: creditPackResponse.data?.active
          },
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn(`⚠️ [createUserProfileWithBackend] Failed to create welcome credit pack:`, {
          step: 'welcome_credit_pack_failed',
          error: creditPackResponse.message,
          code: creditPackResponse.code,
          timestamp: new Date().toISOString()
        });
      }
    } catch (creditPackError) {
      console.error(`❌ [createUserProfileWithBackend] Error creating welcome credit pack:`, {
        step: 'welcome_credit_pack_error',
        error: creditPackError,
        backendAccountId: backendAccount.id,
        timestamp: new Date().toISOString()
      });
      // 不抛出错误，因为用户账户已经创建成功，credit pack失败不应该阻止用户注册
    }

    // 4. 获取并存储init API key
    try {
      console.log(`🔑 [createUserProfileWithBackend] Fetching init API key for new user:`, {
        backendAccountId: backendAccount.id,
        timestamp: new Date().toISOString()
      });

      // 获取API keys列表
      const apiKeysResponse = await backendApiClient.getAccountApiKeys(backendAccount.id);
      
      if (apiKeysResponse.code === 200 && apiKeysResponse.data?.length > 0) {
        const initApiKey = apiKeysResponse.data[0].value;
        
        console.log(`✅ [createUserProfileWithBackend] Found init API key:`, {
          step: 'init_api_key_found',
          success: true,
          apiKeyPreview: initApiKey.substring(0, 8) + '...',
          totalKeys: apiKeysResponse.data.length,
          timestamp: new Date().toISOString()
        });

        // 更新UserProfile中的initApiKey
        await prisma.userProfile.update({
          where: { userId },
          data: { initApiKey }
        });

        console.log(`✅ [createUserProfileWithBackend] Init API key stored successfully:`, {
          step: 'init_api_key_stored',
          success: true,
          userId,
          backendAccountId: backendAccount.id,
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn(`⚠️ [createUserProfileWithBackend] No API keys found for new user:`, {
          step: 'no_api_keys_found',
          backendAccountId: backendAccount.id,
          responseCode: apiKeysResponse.code,
          hasData: !!apiKeysResponse.data,
          keysCount: apiKeysResponse.data?.length || 0,
          timestamp: new Date().toISOString()
        });
      }
    } catch (apiKeyError) {
      console.error(`❌ [createUserProfileWithBackend] Error fetching init API key:`, {
        step: 'init_api_key_error',
        error: apiKeyError,
        backendAccountId: backendAccount.id,
        timestamp: new Date().toISOString()
      });
      // 不抛出错误，因为用户账户已经创建成功，API key获取失败不应该阻止用户注册
    }

    console.log(`🎯 Profile creation completed, fetching final user data...`);

    // 5. 返回完整用户信息
    const finalUserData = await getUserWithProfile(userId);
    
    console.log(`🏁 Final user profile created:`, {
      userId,
      email,
      hasProfile: !!finalUserData?.profile,
      backendAccountId: finalUserData?.profile?.backendAccountId,
      plan: finalUserData?.profile?.plan,
      initApiKey: finalUserData?.profile?.initApiKey ? 
        finalUserData.profile.initApiKey.substring(0, 8) + '...' : 
        (finalUserData?.profile?.preferences as any)?.initApiKey ? 
          ((finalUserData.profile.preferences as any).initApiKey as string).substring(0, 8) + '...' : null,
      hasPaymentCustomer: !!finalUserData?.paymentCustomer
    });

    return finalUserData;
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
    console.log(`🔗 [linkExistingBackendAccount] Linking backend account for user: ${userId}`);
    
    // 0. 获取用户信息 
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { email: true, name: true, image: true }
    });

    if (!existingProfile || !existingProfile.email) {
      console.error('❌ [linkExistingBackendAccount] UserProfile not found or missing email');
      throw new Error('UserProfile not found or missing email');
    }
    
    // 1. 使用API密钥获取backend账户信息
    const accountResponse = await backendApiClient.getCurrentAccountInfo(userApiKey);
    
    if (accountResponse.code !== 200) {
      console.error('❌ [linkExistingBackendAccount] Failed to get account info:', accountResponse);
      throw new Error(`Failed to get backend account info: ${accountResponse.message}`);
    }

    const backendAccount = accountResponse.data;
    const frontendPlan = backendAccount.plan === 'developer' ? 'pro' : 'free';

    console.log(`✅ [linkExistingBackendAccount] Retrieved backend account:`, {
      id: backendAccount.id,
      name: backendAccount.name,
      plan: backendAccount.plan,
      frontendPlan,
      is_enable: backendAccount.is_enable,
      wallet: backendAccount.wallet ? {
        point_remain: backendAccount.wallet.point_remain,
        point_used: backendAccount.wallet.point_used
      } : null
    });

    // 2. 更新或创建前端profile
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
      console.log(`✅ [linkExistingBackendAccount] Profile updated successfully with initApiKey`);
    } catch (dbError) {
      // Fallback if initApiKey column doesn't exist
      console.warn('⚠️ [linkExistingBackendAccount] Failed with initApiKey, trying preferences fallback:', dbError);
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
      console.log(`✅ [linkExistingBackendAccount] Profile updated successfully with preferences fallback`);
    }

    // 3. 返回更新后的用户信息
    return await getUserWithProfile(userId);

  } catch (error) {
    console.error('❌ [linkExistingBackendAccount] Error linking backend account:', error);
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