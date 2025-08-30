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
  
  let user;
  
  // 尝试通过 ID 查询（可能是 MongoDB ObjectId 或 Google ID）
  try {
    user = await User.findById(userId).select(
      'name email image plan subscriptionStatus preferences credits totalAvatarsCreated lastLoginAt'
    );
  } catch (error) {
    // 如果 ID 查询失败，尝试通过 email 查询
    // 这种情况通常发生在 Google 登录时，session.user.id 是 Google ID 而不是 MongoDB ObjectId
    console.log(`Failed to find user by ID ${userId}, trying alternative methods...`);
    
    // 从 session 中获取 email 信息
    // 由于这里无法直接访问 session，我们需要修改调用方式
    // 暂时返回 null，让调用方处理
    return null;
  }
  
  if (!user) return null;

  const planLimits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

  return {
    user,
    credits: user.credits,
    planLimits,
  };
}

export async function getUserWithUsageByEmail(email: string) {
  await connectMongo();
  
  const user = await User.findOne({ email }).select(
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

export async function canUserGenerateAvatar(userId: string, email?: string): Promise<boolean> {
  await connectMongo();
  
  let user = await User.findById(userId);
  
  // 如果通过 ID 查询失败，尝试通过 email 查询
  if (!user && email) {
    user = await User.findOne({ email });
  }
  
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

export async function getUserSubscriptionStatus(userId: string, email?: string) {
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
  reason: string = "subscription_upgrade",
  email?: string
): Promise<any> {
  await connectMongo();
  
  let user = await User.findByIdAndUpdate(
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
  
  // 如果通过 ID 查询失败，尝试通过 email 查询
  if (!user && email) {
    user = await User.findOneAndUpdate(
      { email },
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
  }
  
  if (!user) {
    throw new Error("User not found");
  }
  
  return user;
}

export async function updateUserPreferences(userId: string, preferences: any, email?: string) {
  await connectMongo();
  
  let user = await User.findById(userId);
  
  // 如果通过 ID 查询失败，尝试通过 email 查询
  if (!user && email) {
    user = await User.findOne({ email });
  }
  
  if (!user) throw new Error('User not found');

  user.preferences = {
    ...user.preferences,
    ...preferences,
  };
  
  await user.save();
  return user;
}

export async function updateUserProfile(userId: string, profileData: { name?: string }, email?: string) {
  await connectMongo();
  
  let user = await User.findById(userId);
  
  // 如果通过 ID 查询失败，尝试通过 email 查询
  if (!user && email) {
    user = await User.findOne({ email });
  }
  
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

export async function getUserDashboardData(userId: string, email?: string) {
  // Use the smart user lookup function
  const user = await findUserByIdOrEmail(userId, email);
  
  if (!user) {
    return null;
  }
  
  // Get user data with usage
  const userData = await getUserWithUsage(user._id.toString());
  
  if (!userData) {
    return null;
  }
  
  const subscriptionStatus = await getUserSubscriptionStatus(user._id.toString(), user.email);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      totalAvatarsCreated: user.totalAvatarsCreated || 0,
      lastLoginAt: user.lastLoginAt,
      preferences: user.preferences,
    },
    credits: {
      balance: user.credits.balance,
      totalEarned: user.credits.totalEarned,
      totalSpent: user.credits.totalSpent,
      lastCreditGrant: user.credits.lastCreditGrant,
    },
    planLimits: PLAN_LIMITS[user.plan] || PLAN_LIMITS.free,
    subscription: {
      isActive: subscriptionStatus.hasActiveSubscription,
      plan: user.plan,
      endDate: subscriptionStatus.subscription?.endDate,
    },
  };
}

// Smart user lookup function that handles both ObjectId and Google ID
export async function findUserByIdOrEmail(userId: string, email?: string) {
  try {
    await connectMongo();
    
    // First, try to find by ID (could be ObjectId or Google ID)
    let user = null;
    
    try {
      // Check if userId is a valid ObjectId
      if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
        user = await User.findById(userId);
        if (user) {
          return user;
        }
      }
    } catch (error) {
      // Continue to next method
    }
    
    // If not found by ID, try by email
    if (!user && email) {
      try {
        user = await User.findOne({ email });
        if (user) {
          return user;
        }
      } catch (error) {
        // Continue to next method
      }
    }
    
    // If still not found, try to find by googleId
    if (!user && userId) {
      try {
        user = await User.findOne({ googleId: userId });
        if (user) {
          return user;
        }
      } catch (error) {
        // Continue to next method
      }
    }

    // 最后尝试通过多个条件联合查询
    if (!user && (userId || email)) {
      try {
        const searchConditions = [];
        
        if (email) {
          searchConditions.push({ email: email });
        }
        
        if (userId) {
          // 如果userId看起来像ObjectId
          if (/^[0-9a-fA-F]{24}$/.test(userId)) {
            searchConditions.push({ _id: userId });
          } else {
            // 否则当作googleId处理
            searchConditions.push({ googleId: userId });
          }
        }
        
        if (searchConditions.length > 0) {
          user = await User.findOne({ $or: searchConditions });
          if (user) {
            return user;
          }
        }
      } catch (error) {
        // Final fallback failed
      }
    }
    
    return null;
    
  } catch (error) {
    console.error(`Error in findUserByIdOrEmail:`, error.message);
    throw error;
  }
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