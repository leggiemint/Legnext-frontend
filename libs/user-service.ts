import { prisma } from "@/libs/prisma";

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
        // Create profile
        const profile = await tx.userProfile.create({
          data: {
            userId: user.id,
            plan: "free",
            credits: 60,
            totalCreditsEarned: 60,
            preferences: {
              defaultStyle: "anime",
              emailNotifications: true,
              theme: "light"
            }
          }
        });

        // Record welcome transaction
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "credit_purchase",
            amount: 60,
            description: "Welcome bonus credits",
            status: "completed"
          }
        });

        return profile;
      });

      user.profile = newProfile;
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
        credits: 60,
        totalCreditsEarned: 60,
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

export default {
  getUserWithProfile,
  consumeCredits,
  grantCredits,
  updateSubscription,
  incrementImageCount
};