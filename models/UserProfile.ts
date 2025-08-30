import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// 用户业务数据模型 - 与NextAuth的users表分离
const userProfileSchema = new mongoose.Schema(
  {
    // NextAuth用户ID引用
    userId: {
      type: String, // NextAuth的用户ID
      required: true,
      unique: true,
      index: true,
    },
    // 业务相关字段
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    // Credits system (0.1$ = 1 credit)
    credits: {
      balance: {
        type: Number,
        default: 60, // 新用户获得60积分 ($6价值)
      },
      totalEarned: {
        type: Number,
        default: 60,
      },
      totalSpent: {
        type: Number,
        default: 0,
      },
      lastCreditGrant: {
        date: Date,
        amount: Number,
        reason: String, // "welcome_bonus", "subscription_renewal", "manual_grant"
      },
    },
    // Subscription management
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "canceled", "past_due", "trialing"],
      default: "inactive",
    },
    subscriptionEndDate: {
      type: Date,
    },
    subscriptionStartDate: {
      type: Date,
    },
    // 用户使用统计
    monthlyUsage: {
      avatarsGenerated: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },
    // 用户偏好设置
    preferences: {
      defaultStyle: {
        type: String,
        enum: ["anime", "realistic", "cartoon", "chibi"],
        default: "anime",
      },
      defaultFormat: {
        type: String,
        enum: ["png", "jpg", "webp"],
        default: "png",
      },
      autoSave: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
    },
    // 统计数据
    totalAvatarsCreated: {
      type: Number,
      default: 0,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    // Stripe相关
    customerId: {
      type: String,
      validate(value: string) {
        return value.includes("cus_");
      },
    },
    priceId: {
      type: String,
      validate(value: string) {
        return value.includes("price_");
      },
    },
    hasAccess: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// 添加插件
userProfileSchema.plugin(toJSON);

// 索引
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ plan: 1 });
userProfileSchema.index({ subscriptionStatus: 1 });

export default mongoose.models.UserProfile || mongoose.model("UserProfile", userProfileSchema);
