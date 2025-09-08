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
            plan: "hobbyist",
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
          await createUserBackendAccount(user.id, user.email, "hobbyist");
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
 * Grant credits to user account
 */
export async function grantCredits(
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
          type: "credit_purchase",
          amount,
          description,
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
    console.error("Error granting credits:", error);
    return { success: false, error: "Database error" };
  }
}

/**
 * Update user subscription
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
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        plan,
        subscriptionStatus: status,
        ...(customerId && { stripeCustomerId: customerId }),
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
        ...(customerId && { stripeCustomerId: customerId }),
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
        console.log(`✅ Initial API key stored for user: ${email}`);
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

    // 🎯 同步100欢迎credits到前端数据库
    try {
      console.log(`💰 Syncing 100 welcome credits to frontend for user: ${email}`);
      const grantResult = await grantCredits(
        userId,
        100,
        "Welcome bonus for new user",
        "welcome_bonus",
        null
      );

      if (grantResult.success) {
        console.log(`✅ Welcome credits synced successfully: ${grantResult.newBalance} total credits`);
      } else {
        console.error(`⚠️ Failed to sync welcome credits: ${grantResult.error}`);
      }
    } catch (syncError) {
      console.error("⚠️ Error syncing welcome credits:", syncError?.message || syncError);
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