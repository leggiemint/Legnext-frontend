import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// Define operation types and their credit costs
const OPERATION_COSTS = {
  avatar_generation: 5, // 5 credits per avatar generation
  expression_pack: 3, // 3 credits per expression pack
  animation: 2, // 2 credits per animation
  hd_export: 1, // 1 credit per HD export
  api_request: 0.1, // 0.1 credits per API request
} as const;

type OperationType = keyof typeof OPERATION_COSTS;

// USAGE TRACKING SCHEMA - Streamlined for credit-based system
const usageSchema = new mongoose.Schema(
  {
    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Time period tracking
    period: {
      year: {
        type: Number,
        required: true,
        index: true,
      },
      month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
        index: true,
      },
    },
    // Plan information for this period
    planInfo: {
      planType: {
        type: String,
        enum: ["free", "pro"],
        required: true,
      },
      planLimits: {
        avatarsPerMonth: Number,
        expressionsPerAvatar: Number,
        animationsAllowed: Boolean,
        hdExportsAllowed: Boolean,
        watermarkFree: Boolean,
      },
    },
    // Avatar generation usage
    avatarGeneration: {
      totalGenerated: {
        type: Number,
        default: 0,
      },
      successful: {
        type: Number,
        default: 0,
      },
      failed: {
        type: Number,
        default: 0,
      },
      // Breakdown by style
      byStyle: {
        anime: { type: Number, default: 0 },
        realistic: { type: Number, default: 0 },
        cartoon: { type: Number, default: 0 },
        chibi: { type: Number, default: 0 },
      },
      // Daily breakdown for analytics
      dailyBreakdown: [
        {
          date: Date,
          count: Number,
          successful: Number,
          failed: Number,
        },
      ],
    },
    // Session information (optional)
    sessionId: String,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for performance
usageSchema.index({ userId: 1, createdAt: -1 });
usageSchema.index({ "operation.type": 1, createdAt: -1 });
usageSchema.index({ userPlan: 1, createdAt: -1 });
usageSchema.index({ createdAt: -1 }); // For analytics queries

// Static method to record usage and consume credits
usageSchema.statics.recordUsage = async function (
  userId: string,
  operationType: OperationType,
  metadata: any = {},
  sessionInfo: any = {}
) {
  const User = mongoose.model("User");
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error("User not found");
  }
  
  const creditsRequired = OPERATION_COSTS[operationType];
  
  // Check if user has enough credits
  if (user.credits.balance < creditsRequired) {
    throw new Error("Insufficient credits");
  }
  
  // Calculate new balance
  const balanceBefore = user.credits.balance;
  const balanceAfter = balanceBefore - creditsRequired;
  
  // Create usage record
  const usage = new this({
    userId,
    operation: {
      type: operationType,
      metadata,
    },
    creditsConsumed: creditsRequired,
    userPlan: user.plan,
    balanceBefore,
    balanceAfter,
    sessionId: sessionInfo.sessionId,
    ipAddress: sessionInfo.ipAddress,
    userAgent: sessionInfo.userAgent,
  });
  
  // Update user credits atomically
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $inc: {
        "credits.balance": -creditsRequired,
        "credits.totalSpent": creditsRequired,
      },
    },
    { new: true }
  );
  
  if (!updatedUser) {
    throw new Error("Failed to update user credits");
  }
  
  await usage.save();
  return { usage, user: updatedUser };
};

// Static method to get user usage summary
usageSchema.statics.getUserUsageSummary = async function (
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const matchFilter: any = { userId };
  
  if (startDate || endDate) {
    matchFilter.createdAt = {};
    if (startDate) matchFilter.createdAt.$gte = startDate;
    if (endDate) matchFilter.createdAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: "$operation.type",
        count: { $sum: 1 },
        totalCredits: { $sum: "$creditsConsumed" },
        successfulOperations: {
          $sum: { $cond: ["$operation.metadata.successful", 1, 0] }
        },
      },
    },
    {
      $group: {
        _id: null,
        operationBreakdown: {
          $push: {
            operation: "$_id",
            count: "$count",
            totalCredits: "$totalCredits",
            successfulOperations: "$successfulOperations",
          },
        },
        totalOperations: { $sum: "$count" },
        totalCreditsSpent: { $sum: "$totalCredits" },
      },
    },
  ]);
};

// Static method to get usage analytics for admin
usageSchema.statics.getUsageAnalytics = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          userPlan: "$userPlan",
          operation: "$operation.type",
        },
        count: { $sum: 1 },
        totalCredits: { $sum: "$creditsConsumed" },
        uniqueUsers: { $addToSet: "$userId" },
      }
    },
    {
      $group: {
        _id: "$_id.userPlan",
        operations: {
          $push: {
            type: "$_id.operation",
            count: "$count",
            totalCredits: "$totalCredits",
          },
        },
        totalOperations: { $sum: "$count" },
        totalCreditsConsumed: { $sum: "$totalCredits" },
        uniqueUsers: { $first: { $size: "$uniqueUsers" } },
      }
    }
  ]);
};

// Static method for backward compatibility
usageSchema.statics.canGenerateAvatar = async function (userId: string) {
  const User = mongoose.model("User");
  const user = await User.findById(userId);
  
  if (!user) return false;
  
  const creditsRequired = OPERATION_COSTS.avatar_generation;
  return user.credits.balance >= creditsRequired;
};

// add plugin that converts mongoose to json
usageSchema.plugin(toJSON);

export default mongoose.models.Usage || mongoose.model("Usage", usageSchema);