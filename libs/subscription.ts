import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import Subscription from "@/models/Subscription";

// 🏆 Industry Standard: Subscription Management Service
// This service handles subscription state validation and management

export interface SubscriptionStatus {
  isActive: boolean;
  plan: "free" | "pro";
  subscriptionStatus: string;
  canSubscribe: boolean;
  canUpgrade: boolean;
  canDowngrade: boolean;
  subscriptionEndDate?: Date;
  daysRemaining?: number;
  nextBillingDate?: Date;
}

export interface SubscriptionValidationResult {
  valid: boolean;
  reason?: string;
  allowSubscription: boolean;
  userStatus: SubscriptionStatus;
}

/**
 * 🔍 Get comprehensive subscription status for a user
 * Industry Standard: Always validate subscription state before actions
 */
export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  await connectMongo();
  
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();
  const isActive = user.subscriptionStatus === "active" && user.hasAccess;
  const isPro = user.plan === "pro";
  
  // Calculate days remaining if subscription has an end date
  let daysRemaining = 0;
  if (user.subscriptionEndDate) {
    const diffTime = user.subscriptionEndDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    isActive,
    plan: user.plan || "free",
    subscriptionStatus: user.subscriptionStatus || "inactive",
    canSubscribe: !isActive && !isPro, // Can subscribe if not active and not already pro
    canUpgrade: !isPro && user.plan === "free", // Can upgrade from free to pro
    canDowngrade: isPro && isActive, // Can downgrade from pro to free
    subscriptionEndDate: user.subscriptionEndDate,
    daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    nextBillingDate: user.subscriptionEndDate // Assuming next billing is at subscription end
  };
}

/**
 * 🚫 Validate if user can proceed with a new subscription
 * Industry Standard: Prevent duplicate subscriptions at multiple levels
 */
export async function validateSubscriptionEligibility(userId: string, priceId: string): Promise<SubscriptionValidationResult> {
  const userStatus = await getUserSubscriptionStatus(userId);
  
  // Check if user already has an active subscription
  if (userStatus.isActive && userStatus.plan === "pro") {
    return {
      valid: false,
      reason: "User already has an active Pro subscription",
      allowSubscription: false,
      userStatus
    };
  }

  // Check if user is in a grace period or past due state
  if (userStatus.subscriptionStatus === "past_due") {
    return {
      valid: false,
      reason: "User subscription is past due. Please resolve payment issues first.",
      allowSubscription: false,
      userStatus
    };
  }

  // Check for recent cancellation (prevent immediate re-subscription)
  const user = await User.findById(userId);
  const recentCancellation = user?.subscriptionHistory?.find((history: any) => 
    history.action === 'canceled' && 
    new Date().getTime() - history.timestamp.getTime() < 24 * 60 * 60 * 1000 // 24 hours
  );

  if (recentCancellation) {
    return {
      valid: false,
      reason: "Recent cancellation detected. Please wait 24 hours before resubscribing.",
      allowSubscription: false,
      userStatus
    };
  }

  return {
    valid: true,
    allowSubscription: true,
    userStatus
  };
}

/**
 * 📊 Record subscription action in history
 * Industry Standard: Maintain audit trail for all subscription changes
 */
export async function recordSubscriptionAction(
  userId: string, 
  action: 'created' | 'upgraded' | 'downgraded' | 'canceled' | 'reactivated' | 'expired',
  fromPlan: string,
  toPlan: string,
  metadata: any = {}
) {
  await connectMongo();
  
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.subscriptionHistory = user.subscriptionHistory || [];
  user.subscriptionHistory.push({
    action,
    fromPlan,
    toPlan,
    timestamp: new Date(),
    metadata
  });

  await user.save();
  
  return user.subscriptionHistory[user.subscriptionHistory.length - 1];
}

/**
 * 🔄 Check for and clean up stale subscriptions
 * Industry Standard: Regular maintenance of subscription states
 */
export async function cleanupStaleSubscriptions() {
  await connectMongo();
  
  const now = new Date();
  
  // Find users with expired subscriptions that are still marked as active
  const expiredUsers = await User.find({
    subscriptionStatus: "active",
    subscriptionEndDate: { $lt: now },
    plan: "pro"
  });

  for (const user of expiredUsers) {
    console.log(`Cleaning up expired subscription for user ${user._id}`);
    
    // Record the expiration
    await recordSubscriptionAction(
      user._id.toString(),
      'expired',
      user.plan,
      'free',
      { source: 'automated_cleanup', expiredAt: now }
    );
    
    // Update user status
    user.subscriptionStatus = "canceled";
    user.hasAccess = false;
    user.plan = "free";
    
    await user.save();
  }
  
  return { cleanedUp: expiredUsers.length };
}

/**
 * 📈 Get subscription analytics for admin dashboard
 * Industry Standard: Provide insights into subscription patterns
 */
export async function getSubscriptionAnalytics() {
  await connectMongo();
  
  const [activeSubscriptions, totalUsers, recentCancellations, newSubscriptions] = await Promise.all([
    User.countDocuments({ subscriptionStatus: "active", plan: "pro" }),
    User.countDocuments({}),
    User.countDocuments({
      "subscriptionHistory.action": "canceled",
      "subscriptionHistory.timestamp": { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }),
    User.countDocuments({
      "subscriptionHistory.action": "upgraded",
      "subscriptionHistory.timestamp": { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    })
  ]);

  return {
    activeSubscriptions,
    totalUsers,
    conversionRate: totalUsers > 0 ? (activeSubscriptions / totalUsers * 100).toFixed(2) : 0,
    recentCancellations,
    newSubscriptions,
    churnRate: activeSubscriptions > 0 ? (recentCancellations / activeSubscriptions * 100).toFixed(2) : 0
  };
}
