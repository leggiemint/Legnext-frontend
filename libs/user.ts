import User from "@/models/User";
import Usage from "@/models/Usage";
import Subscription from "@/models/Subscription";
import connectMongo from "@/libs/mongoose";

export interface UserLimits {
  creditsPerMonth: number;
  animationsAllowed: boolean;
  hdExportsAllowed: boolean;
  watermarkFree: boolean;
  commercialUse: boolean;
}

export interface UserUsageData {
  creditsBalance: number;
  creditsSpent: number;
  totalDownloads: number;
}

export const PLAN_LIMITS: Record<string, UserLimits> = {
  free: {
    creditsPerMonth: 0, // Free users get one-time credits only
    animationsAllowed: false,
    hdExportsAllowed: false,
    watermarkFree: false,
    commercialUse: false,
  },
  pro: {
    creditsPerMonth: 260, // 60 (free) + 200 (pro) = 260 credits = $26 worth
    animationsAllowed: true,
    hdExportsAllowed: true,
    watermarkFree: true,
    commercialUse: true,
  },
};

// Credit costs for operations (matches Usage model)
export const OPERATION_COSTS = {
  avatar_generation: 5,
  expression_pack: 3,
  animation: 2,
  hd_export: 1,
  api_request: 0.1,
} as const;

export async function getUserWithUsage(userId: string) {
  await connectMongo();
  
  const user = await User.findById(userId).select(
    'name email image plan subscriptionStatus preferences credits totalAvatarsCreated lastLoginAt'
  );
  
  if (!user) return null;

  const planLimits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

  return {
    user,
    credits: user.credits,
    planLimits,
  };
}

export async function canUserGenerateAvatar(userId: string): Promise<boolean> {
  await connectMongo();
  
  const user = await User.findById(userId);
  if (!user) return false;
  
  return user.credits.balance >= OPERATION_COSTS.avatar_generation;
}

export async function consumeCreditsForOperation(
  userId: string,
  operationType: keyof typeof OPERATION_COSTS,
  metadata: any = {},
  sessionInfo: any = {}
) {
  await connectMongo();
  return await (Usage as any).recordUsage(userId, operationType, metadata, sessionInfo);
}

export async function getUserSubscriptionStatus(userId: string) {
  await connectMongo();
  
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] }
  }).sort({ createdAt: -1 });

  return {
    hasActiveSubscription: !!subscription,
    subscription,
    isInTrial: subscription?.isInTrial || false,
    willEndSoon: subscription?.willEndSoon || false,
    daysRemaining: subscription?.daysRemaining || 0,
  };
}

export function calculateCreditUsagePercentage(spent: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((spent / total) * 100));
}

export function getRemainingCredits(balance: number): number {
  return Math.max(0, balance);
}

export function canAffordOperation(balance: number, operationType: keyof typeof OPERATION_COSTS): boolean {
  return balance >= OPERATION_COSTS[operationType];
}

export async function grantCreditsToUser(
  userId: string, 
  amount: number, 
  reason: string = "subscription_upgrade"
): Promise<any> {
  await connectMongo();
  
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $inc: {
        "credits.balance": amount,
        "credits.totalEarned": amount,
      },
      $set: {
        "credits.lastCreditGrant": {
          date: new Date(),
          amount,
          reason,
        },
      },
    },
    { new: true }
  );
  
  if (!user) {
    throw new Error("User not found");
  }
  
  return user;
}

export async function updateUserPreferences(userId: string, preferences: any) {
  await connectMongo();
  
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.preferences = {
    ...user.preferences,
    ...preferences,
  };
  
  await user.save();
  return user;
}

export async function updateUserProfile(userId: string, profileData: { name?: string }) {
  await connectMongo();
  
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (profileData.name && profileData.name.trim()) {
    user.name = profileData.name.trim();
  }
  
  user.lastLoginAt = new Date();
  await user.save();
  
  return user;
}

export function formatUsageData(user: any, planLimits: UserLimits): UserUsageData {
  return {
    creditsBalance: user.credits.balance,
    creditsSpent: user.credits.totalSpent,
    totalDownloads: 0, // Will be populated from Usage analytics if needed
  };
}

export async function getUserDashboardData(userId: string) {
  const userData = await getUserWithUsage(userId);
  if (!userData) return null;

  const subscriptionStatus = await getUserSubscriptionStatus(userId);

  return {
    user: {
      id: userData.user._id,
      name: userData.user.name,
      email: userData.user.email,
      image: userData.user.image,
      plan: userData.user.plan,
      subscriptionStatus: userData.user.subscriptionStatus,
      totalAvatarsCreated: userData.user.totalAvatarsCreated || 0,
      lastLoginAt: userData.user.lastLoginAt,
      preferences: userData.user.preferences,
    },
    credits: {
      balance: userData.credits.balance,
      totalEarned: userData.credits.totalEarned,
      totalSpent: userData.credits.totalSpent,
      lastCreditGrant: userData.credits.lastCreditGrant,
    },
    planLimits: userData.planLimits,
    subscription: {
      isActive: subscriptionStatus.hasActiveSubscription,
      plan: userData.user.plan,
      endDate: subscriptionStatus.subscription?.endDate,
    },
  };
}

export default {
  getUserWithUsage,
  canUserGenerateAvatar,
  consumeCreditsForOperation,
  getUserSubscriptionStatus,
  calculateCreditUsagePercentage,
  getRemainingCredits,
  canAffordOperation,
  grantCreditsToUser,
  updateUserPreferences,
  updateUserProfile,
  formatUsageData,
  getUserDashboardData,
  PLAN_LIMITS,
  OPERATION_COSTS,
};