import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// SUBSCRIPTION SCHEMA
const subscriptionSchema = new mongoose.Schema(
  {
    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Stripe subscription details
    stripeSubscriptionId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      index: true,
    },
    stripePriceId: {
      type: String,
      required: true,
    },
    stripeProductId: {
      type: String,
      required: true,
    },
    // Subscription details
    planId: {
      type: String,
      enum: ["free", "pro"],
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    // Billing details
    billing: {
      interval: {
        type: String,
        enum: ["month", "year"],
        required: true,
      },
      intervalCount: {
        type: Number,
        default: 1,
      },
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "usd",
        uppercase: true,
      },
    },
    // Subscription status
    status: {
      type: String,
      enum: [
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "paused",
        "trialing",
        "unpaid"
      ],
      required: true,
      index: true,
    },
    // Important dates
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
      index: true,
    },
    trialStart: Date,
    trialEnd: Date,
    canceledAt: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    endedAt: Date,
    // Plan features and limits
    features: {
      avatarsPerMonth: {
        type: Number,
        required: true,
      },
      expressionsPerAvatar: {
        type: Number,
        required: true,
      },
      animationsAllowed: {
        type: Boolean,
        required: true,
      },
      hdExportsAllowed: {
        type: Boolean,
        required: true,
      },
      watermarkFree: {
        type: Boolean,
        required: true,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      apiAccess: {
        type: Boolean,
        default: false,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
    },
    // Payment method
    defaultPaymentMethod: {
      paymentMethodId: String,
      type: {
        type: String,
        enum: ["card", "paypal", "apple_pay", "google_pay"],
      },
      card: {
        brand: String,
        last4: String,
        expMonth: Number,
        expYear: Number,
      },
    },
    // Discount and coupon information
    discount: {
      couponId: String,
      couponName: String,
      discountType: {
        type: String,
        enum: ["percent", "amount"],
      },
      discountValue: Number,
      validUntil: Date,
      appliedAt: Date,
    },
    // Subscription history
    history: [
      {
        action: {
          type: String,
          enum: [
            "created",
            "updated", 
            "canceled",
            "reactivated",
            "paused",
            "resumed",
            "trial_started",
            "trial_ended",
            "payment_failed",
            "payment_succeeded"
          ],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: mongoose.Schema.Types.Mixed,
        performedBy: {
          type: String,
          enum: ["user", "admin", "system", "stripe"],
          default: "system",
        },
      },
    ],
    // Upgrade/downgrade tracking
    planChanges: [
      {
        fromPlan: String,
        toPlan: String,
        changeDate: {
          type: Date,
          default: Date.now,
        },
        reason: String,
        proratedAmount: Number,
        effectiveDate: Date,
      },
    ],
    // Cancellation details
    cancellation: {
      reason: {
        type: String,
        enum: [
          "user_request",
          "payment_failed",
          "admin_action",
          "policy_violation",
          "other"
        ],
      },
      feedback: String,
      canceledBy: {
        type: String,
        enum: ["user", "admin", "system"],
      },
      refundIssued: {
        type: Boolean,
        default: false,
      },
      refundAmount: Number,
    },
    // Renewal and billing
    renewal: {
      willRenew: {
        type: Boolean,
        default: true,
      },
      nextBillingDate: Date,
      renewalAttempts: {
        type: Number,
        default: 0,
      },
      lastRenewalAttempt: Date,
      renewalFailures: [
        {
          date: Date,
          reason: String,
          errorCode: String,
        },
      ],
    },
    // Webhook tracking
    webhookEvents: [
      {
        eventId: String,
        eventType: String,
        processed: {
          type: Boolean,
          default: false,
        },
        processedAt: Date,
        error: String,
      },
    ],
    // Metadata
    metadata: {
      source: {
        type: String,
        enum: ["web", "mobile", "api", "admin"],
        default: "web",
      },
      campaignId: String,
      referralCode: String,
      originalPlan: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual("isActive").get(function () {
  return ["active", "trialing"].includes(this.status);
});

// Virtual for checking if subscription is in trial
subscriptionSchema.virtual("isInTrial").get(function () {
  return this.status === "trialing" && this.trialEnd && this.trialEnd > new Date();
});

// Virtual for checking if subscription will end soon
subscriptionSchema.virtual("willEndSoon").get(function () {
  if (!this.currentPeriodEnd) return false;
  const daysUntilEnd = Math.ceil((this.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return daysUntilEnd <= 7;
});

// Virtual for days remaining
subscriptionSchema.virtual("daysRemaining").get(function () {
  if (!this.currentPeriodEnd) return 0;
  const days = Math.ceil((this.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
});

// Virtual for next billing amount
subscriptionSchema.virtual("nextBillingAmount").get(function () {
  let amount = this.billing.amount;
  
  // Apply discount if applicable
  if (this.discount && this.discount.validUntil && this.discount.validUntil > new Date()) {
    if (this.discount.discountType === "percent") {
      amount = amount * (1 - this.discount.discountValue / 100);
    } else {
      amount = Math.max(0, amount - this.discount.discountValue);
    }
  }
  
  return amount;
});

// Pre-save middleware
subscriptionSchema.pre("save", function (next) {
  // Add to history if status changed
  if (this.isModified("status")) {
    this.history.push({
      action: this.status === "active" ? "reactivated" : 
              this.status === "canceled" ? "canceled" :
              this.status === "paused" ? "paused" : "updated",
      timestamp: new Date(),
      details: { newStatus: this.status },
      performedBy: "system",
    });
  }
  
  // Set renewal date
  if (this.isModified("currentPeriodEnd") && this.renewal.willRenew) {
    this.renewal.nextBillingDate = this.currentPeriodEnd;
  }
  
  next();
});

// Static method to get active subscriptions expiring soon
subscriptionSchema.statics.getExpiringSubscriptions = function (days: number = 7) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  
  return this.find({
    status: { $in: ["active", "trialing"] },
    currentPeriodEnd: { $lte: expirationDate },
    cancelAtPeriodEnd: false,
  }).populate("userId", "name email");
};

// Static method to get subscription statistics
subscriptionSchema.statics.getSubscriptionStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$billing.amount" },
      }
    }
  ]);
};

// Instance method to cancel subscription
subscriptionSchema.methods.cancelSubscription = function (reason: string, canceledBy: string = "user", feedback?: string) {
  this.status = "canceled";
  this.canceledAt = new Date();
  this.cancellation = {
    reason,
    feedback,
    canceledBy,
    refundIssued: false,
  };
  
  this.history.push({
    action: "canceled",
    timestamp: new Date(),
    details: { reason, feedback },
    performedBy: canceledBy,
  });
  
  return this.save();
};

// Instance method to reactivate subscription
subscriptionSchema.methods.reactivateSubscription = function (newPeriodEnd: Date) {
  this.status = "active";
  this.currentPeriodEnd = newPeriodEnd;
  this.canceledAt = undefined;
  this.cancelAtPeriodEnd = false;
  
  this.history.push({
    action: "reactivated",
    timestamp: new Date(),
    details: { newPeriodEnd },
    performedBy: "system",
  });
  
  return this.save();
};

// Instance method to change plan
subscriptionSchema.methods.changePlan = function (newPlanId: string, newFeatures: any, effectiveDate?: Date) {
  const oldPlan = this.planId;
  
  this.planChanges.push({
    fromPlan: oldPlan,
    toPlan: newPlanId,
    changeDate: new Date(),
    effectiveDate: effectiveDate || new Date(),
  });
  
  this.planId = newPlanId;
  this.features = { ...this.features, ...newFeatures };
  
  this.history.push({
    action: "updated",
    timestamp: new Date(),
    details: { planChange: { from: oldPlan, to: newPlanId } },
    performedBy: "user",
  });
  
  return this.save();
};

// add plugin that converts mongoose to json
subscriptionSchema.plugin(toJSON);

export default mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);