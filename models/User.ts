import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// USER SCHEMA
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      private: true,
      unique: true,
    },
    image: {
      type: String,
    },
    // Used in the Stripe webhook to identify the user in Stripe and later create Customer Portal or prefill user credit card details
    customerId: {
      type: String,
      validate(value: string) {
        return value.includes("cus_");
      },
    },
    // Used in the Stripe webhook. should match a plan in config.js file.
    priceId: {
      type: String,
      validate(value: string) {
        return value.includes("price_");
      },
    },
    // Used to determine if the user has access to the product—it's turn on/off by the Stripe webhook
    hasAccess: {
      type: Boolean,
      default: false,
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
    // PngTuber specific fields
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    // Credits system (0.1$ = 1 credit)
    credits: {
      balance: {
        type: Number,
        default: 60, // Free plan starts with 60 credits ($6 worth)
        min: 0,
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
        date: {
          type: Date,
          default: Date.now,
        },
        amount: {
          type: Number,
          default: 60,
        },
        reason: {
          type: String,
          default: "initial_free_credits",
        },
      },
    },
    // Usage tracking for current month (kept for compatibility)
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
    // User preferences
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
    },
    // Statistics
    totalAvatarsCreated: {
      type: Number,
      default: 0,
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);

export default mongoose.models.User || mongoose.model("User", userSchema);
