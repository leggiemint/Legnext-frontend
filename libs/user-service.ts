import { prisma } from "@/libs/prisma";
import { createBackendAccount, validateBackendConfig } from "@/libs/backend-client";

export interface UserWithProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  profile: {
    plan: string;
    credits: number;
    subscriptionStatus: string;
    imagesGenerated: number;
    preferences: any;
    totalCreditsEarned: number;
    totalCreditsSpent: number;
  };
}

/**
 * Get current user with profile
 */
export async function getUserWithProfile(userId: string): Promise<UserWithProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) return null;

    // Create profile if doesn't exist (failsafe)
    if (!user.profile) {
      // Use transaction to ensure consistency
      const newProfile = await prisma.$transaction(async (tx) => {
        // Create profile with 0 initial credits (welcome bonus will be added later)
        const profile = await tx.userProfile.create({
          data: {
            userId: user.id,
            plan: "free",
            credits: 0, // Start with 0, welcome credits will be added through proper flow
            totalCreditsEarned: 0,
            preferences: {
              defaultStyle: "anime",
              emailNotifications: true,
              theme: "light"
            }
          }
        });

        return profile;
      });

      user.profile = newProfile;
      
      // 🚀 自动创建后端账户（静默失败，不影响用户注册）
      if (user.email) {
        try {
          await createUserBackendAccount(user.id, user.email, "free");
        } catch (error) {
          // 静默记录错误，但不影响用户体验
          console.warn(`🔔 Auto backend account creation failed for ${user.email}:`, error?.message || error);
        }
      }
    }


    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      profile: {
        plan: user.profile.plan,
        credits: user.profile.credits as number,
        subscriptionStatus: user.profile.subscriptionStatus,
        imagesGenerated: user.profile.imagesGenerated as number,
        preferences: user.profile.preferences,
        totalCreditsEarned: user.profile.totalCreditsEarned as number,
        totalCreditsSpent: user.profile.totalCreditsSpent as number
      }
    };
  } catch (error) {
    console.error("Error getting user with profile:", error);
    return null;
  }
}

/**
 * Consume credits from user account
 */
export async function consumeCredits(
  userId: string, 
  amount: number, 
  description: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const profile = await tx.userProfile.findUnique({
        where: { userId }
      });

      if (!profile) {
        return { success: false, error: "User profile not found" };
      }

      if (profile.credits < amount) {
        return { success: false, error: "Insufficient credits" };
      }

      // Update profile credits
      const updatedProfile = await tx.userProfile.update({
        where: { userId },
        data: {
          credits: profile.credits - amount,
          totalCreditsSpent: profile.totalCreditsSpent + amount,
          lastActiveAt: new Date()
        }
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          type: "credit_spend",
          amount: -amount, // Negative for spending
          description,
          status: "completed"
        }
      });

      return { 
        success: true, 
        newBalance: updatedProfile.credits 
      };
    });
  } catch (error) {
    console.error("Error consuming credits:", error);
    return { success: false, error: "Database error" };
  }
}

/**
 * Grant credits to user account using credit pack model (统一架构)
 */
export async function grantCredits(
  userId: string,
  amount: number,
  description: string,
  gateway?: string,
  gatewayTxnId?: string,
  expiryDays: number = 180 // 默认6个月过期
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    // 获取用户profile以获取后端账户ID
    const user = await getUserWithProfile(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const backendAccountId = user.profile.preferences?.backendAccountId;
    if (!backendAccountId) {
      // 如果没有后端账户，回退到旧的直接方式（向后兼容）
      console.warn(`⚠️ No backend account for user ${userId}, using legacy direct grant`);
      return await legacyDirectGrant(userId, amount, description, gateway, gatewayTxnId);
    }

    // 🎯 统一使用credit pack模式
    const { createBackendCreditPack } = require("@/libs/backend-client");
    
    // 计算过期时间
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);
    
    const creditPackResult = await createBackendCreditPack({
      accountId: backendAccountId,
      capacity: amount,
      description: `${description} (${expiryDays} days expiry)`,
      expired_at: expiry.toISOString(),
      type: "topup"
    });

    if (!creditPackResult.success) {
      return { success: false, error: creditPackResult.error };
    }

    // 记录credit pack创建事务
    await prisma.transaction.create({
      data: {
        userId,
        type: "credit_pack_created",
        amount,
        description,
        gateway,
        gatewayTxnId,
        status: "completed",
        metadata: {
          backendAccountId,
          creditPackId: creditPackResult.creditPack?.id,
          packType: "manual_grant",
          expiryDays,
          createdVia: "grant_credits_function"
        }
      }
    });

    console.log(`✅ Credit pack created for user ${userId}: ${amount} credits (${expiryDays} days)`);

    // 返回当前可用余额（需要从后端获取最新数据）
    const { getBackendCreditPacks } = require("@/libs/backend-client");
    try {
      const creditPacksResult = await getBackendCreditPacks(backendAccountId);
      const newBalance = creditPacksResult.success ? creditPacksResult.data.available_credits : user.profile.credits;
      return { success: true, newBalance };
    } catch {
      return { success: true, newBalance: user.profile.credits };
    }

  } catch (error) {
    console.error("Error granting credits via credit pack:", error);
    return { success: false, error: "Credit pack creation failed" };
  }
}

/**
 * Legacy direct grant function for backward compatibility
 * @deprecated Use credit pack model via grantCredits
 */
async function legacyDirectGrant(
  userId: string,
  amount: number,
  description: string,
  gateway?: string,
  gatewayTxnId?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const profile = await tx.userProfile.findUnique({
        where: { userId }
      });

      if (!profile) {
        return { success: false, error: "User profile not found" };
      }

      // Update profile credits
      const updatedProfile = await tx.userProfile.update({
        where: { userId },
        data: {
          credits: profile.credits + amount,
          totalCreditsEarned: profile.totalCreditsEarned + amount,
          lastActiveAt: new Date()
        }
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          type: "credit_purchase_legacy",
          amount,
          description: `${description} (Legacy direct grant)`,
          gateway,
          gatewayTxnId,
          status: "completed"
        }
      });

      return { 
        success: true, 
        newBalance: updatedProfile.credits 
      };
    });
  } catch (error) {
    console.error("Error in legacy direct grant:", error);
    return { success: false, error: "Database error" };
  }
}

/**
 * Update user subscription (optimized for Square payments only)
 */
export async function updateSubscription(
  userId: string,
  plan: string,
  status: string,
  customerId?: string,
  priceId?: string,
  subscriptionStart?: Date,
  subscriptionEnd?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    // 更新UserProfile
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        plan,
        subscriptionStatus: status,
        ...(priceId && { currentPriceId: priceId }),
        ...(subscriptionStart && { subscriptionStart }),
        ...(subscriptionEnd && { subscriptionEnd }),
        lastActiveAt: new Date()
      },
      create: {
        userId,
        plan,
        subscriptionStatus: status,
        credits: 100,
        totalCreditsEarned: 100,
        ...(priceId && { currentPriceId: priceId }),
        ...(subscriptionStart && { subscriptionStart }),
        ...(subscriptionEnd && { subscriptionEnd }),
        preferences: {
          defaultStyle: "anime",
          emailNotifications: true,
          theme: "light"
        }
      }
    });

    // 如果提供了customerId，存储到Customer表（使用stripeCustomerId字段存储Square customer ID）
    if (customerId) {
      await prisma.customer.upsert({
        where: { userId },
        update: { stripeCustomerId: customerId }, // 复用现有字段存储Square customer ID
        create: {
          userId,
          stripeCustomerId: customerId
        }
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating subscription:", error);
    return { success: false, error: "Database error" };
  }
}

/**
 * Increment image generation count
 */
export async function incrementImageCount(userId: string): Promise<void> {
  try {
    await prisma.userProfile.update({
      where: { userId },
      data: {
        imagesGenerated: { increment: 1 },
        lastActiveAt: new Date()
      }
    });
  } catch (error) {
    console.error("Error incrementing image count:", error);
  }
}

/**
 * Create backend account for user (optional - if backend system is configured)
 */
export async function createUserBackendAccount(
  userId: string,
  email: string,
  plan?: string
): Promise<{ success: boolean; backendAccountId?: number; error?: string }> {
  try {
    // Check if backend system is configured
    const configCheck = validateBackendConfig();
    if (!configCheck.isValid) {
      console.log(`⚠️ Backend system not configured, skipping backend account creation: ${configCheck.error}`);
      return { success: false, error: "Backend not configured" };
    }

    // Check if user already has backend account
    const user = await getUserWithProfile(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.profile.preferences?.backendAccountId) {
      return { 
        success: false, 
        error: "Backend account already exists",
        backendAccountId: user.profile.preferences.backendAccountId 
      };
    }

    console.log(`🚀 Creating backend account for user: ${email}`);

    // Create backend account with 100 welcome credits
    const backendAccount = await createBackendAccount({
      email,
      plan: plan || user.profile.plan,
      creditRemain: 100, // 新用户默认100 welcome credits
      mjQuotaRemain: 100
    });

    if (backendAccount.code !== 200) {
      return { 
        success: false, 
        error: `Backend account creation failed: ${backendAccount.message}` 
      };
    }

    // Update user profile with backend account info
    // 注意：创建账户时会自动生成一个"Initial Key"
    const initialApiKey = backendAccount.data.api_keys && backendAccount.data.api_keys.length > 0 
      ? backendAccount.data.api_keys[0] 
      : null;

    // 🎯 存储初始API Key到UserApiKey表（行业标准）
    if (initialApiKey?.value) {
      try {
        await prisma.userApiKey.create({
          data: {
            userId: userId,
            name: initialApiKey.name || 'Initial API Key',
            goApiKey: initialApiKey.value,
            isActive: !initialApiKey.revoked
          }
        });
      } catch (error) {
        console.warn(`⚠️ Failed to store initial API key:`, error?.message);
      }
    }

    await prisma.userProfile.update({
      where: { userId },
      data: {
        preferences: {
          ...user.profile.preferences,
          backendAccountId: backendAccount.data.id,
          backendAccountName: backendAccount.data.name,
          backendSyncedAt: new Date().toISOString(),
          hasActiveApiKey: !!initialApiKey && !initialApiKey.revoked
        }
      }
    });

    // Record backend sync transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: "backend_sync",
        amount: user.profile.credits,
        description: "Backend account creation and initial sync",
        status: "completed",
        metadata: {
          backendAccountId: backendAccount.data.id,
          backendAccountName: backendAccount.data.name,
          syncType: "create"
        }
      }
    });

    console.log(`✅ Backend account created successfully for ${email}: ID ${backendAccount.data.id}`);

    // 🎯 创建100欢迎credits的credit pack (31天有效期)
    try {
      console.log(`💰 Creating 100 welcome credits pack for user: ${email}`);
      const { createBackendCreditPack } = require("@/libs/backend-client");
      
      // 计算31天后的过期时间
      const welcomeExpiry = new Date();
      welcomeExpiry.setDate(welcomeExpiry.getDate() + 31);
      
      const welcomePackResult = await createBackendCreditPack({
        accountId: backendAccount.data.id,
        capacity: 100,
        description: "Welcome bonus - 100 credits (31 days expiry)",
        expired_at: welcomeExpiry.toISOString(), // 明确设置31天过期
        type: "topup"
      });

      if (welcomePackResult.success) {
        console.log(`✅ Welcome credit pack created successfully: ${welcomePackResult.creditPack?.id}`);
        
        // 记录credit pack创建日志
        await prisma.transaction.create({
          data: {
            userId,
            type: "credit_pack_created",
            amount: 100,
            description: "Welcome bonus credit pack (31 days)",
            status: "completed",
            gateway: "backend_system",
            metadata: {
              backendAccountId: backendAccount.data.id,
              creditPackId: welcomePackResult.creditPack?.id,
              packType: "welcome_bonus",
              expiryDays: 31,
              createdVia: "user_registration"
            }
          }
        });
      } else {
        console.error(`⚠️ Failed to create welcome credit pack: ${welcomePackResult.error}`);
      }
    } catch (syncError) {
      console.error("⚠️ Error creating welcome credit pack:", syncError?.message || syncError);
      // 不影响账户创建成功状态
    }

    return { 
      success: true, 
      backendAccountId: backendAccount.data.id 
    };

  } catch (error) {
    console.error("❌ Error creating backend account:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export default {
  getUserWithProfile,
  consumeCredits,
  grantCredits,
  updateSubscription,
  incrementImageCount,
  createUserBackendAccount
};