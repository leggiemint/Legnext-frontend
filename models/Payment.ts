import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// PAYMENT SCHEMA
const paymentSchema = new mongoose.Schema(
  {
    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Payment identification
    paymentId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      index: true,
    },
    stripeInvoiceId: {
      type: String,
      index: true,
    },
    // Payment details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      uppercase: true,
    },
    // Payment status
    status: {
      type: String,
      enum: [
        "pending",
        "processing", 
        "succeeded", 
        "failed", 
        "canceled", 
        "refunded", 
        "partially_refunded"
      ],
      required: true,
      index: true,
    },
    // Payment method
    paymentMethod: {
      type: {
        type: String,
        enum: ["card", "paypal", "apple_pay", "google_pay", "bank_transfer"],
        required: true,
      },
      // Card details (if applicable)
      card: {
        brand: String, // visa, mastercard, etc.
        last4: String,
        expMonth: Number,
        expYear: Number,
        country: String,
      },
    },
    // Plan details
    planDetails: {
      planId: {
        type: String,
        required: true,
      },
      planName: {
        type: String,
        required: true,
      },
      billingCycle: {
        type: String,
        enum: ["monthly", "yearly", "one_time"],
        required: true,
      },
      // For subscription payments
      subscriptionId: String,
      periodStart: Date,
      periodEnd: Date,
    },
    // Transaction details
    transactionFee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number, // Amount after fees
    },
    // Refund details
    refund: {
      refundId: String,
      refundAmount: Number,
      refundReason: String,
      refundedAt: Date,
      refundStatus: {
        type: String,
        enum: ["pending", "succeeded", "failed", "canceled"],
      },
    },
    // Invoice details
    invoice: {
      invoiceNumber: String,
      invoiceUrl: String,
      invoicePdf: String,
      dueDate: Date,
    },
    // Customer details at time of payment
    customerDetails: {
      email: String,
      name: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postal_code: String,
        country: String,
      },
      phone: String,
    },
    // Metadata
    metadata: {
      source: {
        type: String,
        enum: ["web", "mobile", "api"],
        default: "web",
      },
      userAgent: String,
      ipAddress: String,
      campaignId: String, // For tracking marketing campaigns
      referrer: String,
    },
    // Timestamps
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    processedAt: Date,
    // Webhook details
    webhookData: {
      stripeEventId: String,
      eventType: String,
      processed: {
        type: Boolean,
        default: false,
      },
      processingError: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ "planDetails.subscriptionId": 1 });
paymentSchema.index({ "webhookData.stripeEventId": 1 });

// Virtual for checking if payment is completed
paymentSchema.virtual("isCompleted").get(function () {
  return this.status === "succeeded";
});

// Virtual for checking if payment is pending
paymentSchema.virtual("isPending").get(function () {
  return ["pending", "processing"].includes(this.status);
});

// Virtual for checking if payment failed
paymentSchema.virtual("isFailed").get(function () {
  return ["failed", "canceled"].includes(this.status);
});

// Virtual for net amount calculation
paymentSchema.virtual("calculatedNetAmount").get(function () {
  if (this.netAmount) return this.netAmount;
  return Math.max(0, this.amount - (this.transactionFee || 0));
});

// Pre-save middleware
paymentSchema.pre("save", function (next) {
  // Generate paymentId if not provided
  if (!this.paymentId) {
    this.paymentId = `pay_${this.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Set processedAt when status changes to succeeded
  if (this.isModified("status") && this.status === "succeeded" && !this.processedAt) {
    this.processedAt = new Date();
  }
  
  // Calculate net amount if not set
  if (!this.netAmount && this.amount) {
    this.netAmount = this.amount - (this.transactionFee || 0);
  }
  
  next();
});

// Static method to get user's payment history
paymentSchema.statics.getUserPayments = function (
  userId: string, 
  options: { status?: string; limit?: number; skip?: number } = {}
) {
  const query: any = { userId };
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to get user's total spent
paymentSchema.statics.getUserTotalSpent = function (userId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: "succeeded" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
};

// Static method to get monthly revenue
paymentSchema.statics.getMonthlyRevenue = function (date: Date = new Date()) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        status: "succeeded",
        paymentDate: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        totalTransactions: { $sum: 1 },
        averageTransaction: { $avg: "$amount" }
      }
    }
  ]);
};

// Instance method to process refund
paymentSchema.methods.processRefund = function (refundAmount: number, reason: string) {
  this.refund = {
    refundAmount,
    refundReason: reason,
    refundedAt: new Date(),
    refundStatus: "pending"
  };
  
  if (refundAmount >= this.amount) {
    this.status = "refunded";
  } else {
    this.status = "partially_refunded";
  }
  
  return this.save();
};

// add plugin that converts mongoose to json
paymentSchema.plugin(toJSON);

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);