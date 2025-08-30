import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// AVATAR SCHEMA
const avatarSchema = new mongoose.Schema(
  {
    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Avatar identification
    avatarId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: "Untitled Avatar",
    },
    // Generation details
    prompt: {
      type: String,
      required: true,
    },
    style: {
      type: String,
      enum: ["anime", "realistic", "cartoon", "chibi"],
      required: true,
    },
    // Image storage
    images: {
      original: {
        url: String,
        s3Key: String,
        size: Number, // File size in bytes
      },
      thumbnail: {
        url: String,
        s3Key: String,
        size: Number,
      },
      highRes: {
        url: String,
        s3Key: String,
        size: Number,
      },
    },
    // Avatar metadata
    metadata: {
      width: Number,
      height: Number,
      format: {
        type: String,
        enum: ["png", "jpg", "webp", "gif"],
        default: "png",
      },
      colorPalette: [String], // Dominant colors
      tags: [String], // AI-generated or user-added tags
    },
    // Expression variations
    expressions: [
      {
        type: {
          type: String,
          enum: ["neutral", "happy", "sad", "angry", "surprised", "wink", "custom"],
          required: true,
        },
        name: String,
        url: String,
        s3Key: String,
        isGenerated: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Animation data
    animations: {
      hasAnimations: {
        type: Boolean,
        default: false,
      },
      blinking: {
        enabled: {
          type: Boolean,
          default: false,
        },
        url: String,
        s3Key: String,
      },
      mouthMovement: {
        enabled: {
          type: Boolean,
          default: false,
        },
        url: String,
        s3Key: String,
      },
    },
    // User interaction
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    // Generation status
    status: {
      type: String,
      enum: ["generating", "completed", "failed", "processing"],
      default: "generating",
    },
    failureReason: {
      type: String,
    },
    // AI generation details
    generationDetails: {
      model: String, // AI model used
      seed: Number, // For reproducibility
      steps: Number,
      guidance: Number,
      generationTime: Number, // in milliseconds
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for performance
avatarSchema.index({ userId: 1, createdAt: -1 });
avatarSchema.index({ status: 1 });
avatarSchema.index({ isFavorite: 1 });
avatarSchema.index({ "metadata.tags": 1 });

// Virtual for checking if avatar has expressions
avatarSchema.virtual("hasExpressions").get(function () {
  return this.expressions && this.expressions.length > 0;
});

// Virtual for total file size
avatarSchema.virtual("totalSize").get(function () {
  let total = 0;
  if (this.images?.original?.size) total += this.images.original.size;
  if (this.images?.thumbnail?.size) total += this.images.thumbnail.size;
  if (this.images?.highRes?.size) total += this.images.highRes.size;
  return total;
});

// Pre-save middleware to generate avatarId if not provided
avatarSchema.pre("save", function (next) {
  if (!this.avatarId) {
    this.avatarId = `avatar_${this.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Static method to get user's avatar count
avatarSchema.statics.getUserAvatarCount = function (userId: string) {
  return this.countDocuments({ userId, status: "completed" });
};

// Static method to get user's monthly avatar count
avatarSchema.statics.getUserMonthlyCount = function (userId: string, date: Date = new Date()) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return this.countDocuments({
    userId,
    status: "completed",
    createdAt: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
  });
};

// Instance method to mark as favorite
avatarSchema.methods.toggleFavorite = function () {
  this.isFavorite = !this.isFavorite;
  return this.save();
};

// Instance method to increment download count
avatarSchema.methods.incrementDownload = function () {
  this.downloadCount += 1;
  return this.save();
};

// add plugin that converts mongoose to json
avatarSchema.plugin(toJSON);

export default mongoose.models.Avatar || mongoose.model("Avatar", avatarSchema);