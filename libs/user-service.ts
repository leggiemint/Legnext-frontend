import { getServerSession } from "next-auth";
import { authOptions } from "./next-auth-standard";
import connectMongo from "./mongoose";
import UserProfile from "@/models/UserProfile";

export interface UserWithProfile {
  // NextAuth user fields
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  // Business profile fields
  profile: {
    plan: string;
    credits: {
      balance: number;
      totalEarned: number;
      totalSpent: number;
      lastCreditGrant?: {
        date: Date;
        amount: number;
        reason: string;
      };
    };
    subscriptionStatus: string;
    preferences: any;
    totalAvatarsCreated: number;
    lastLoginAt: Date;
  };
}

// 获取当前登录用户的完整信息
export async function getCurrentUser(): Promise<UserWithProfile | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return null;
    }

    await connectMongo();
    
    // 查找或创建用户业务档案
    let profile = await UserProfile.findOne({ userId: session.user.id });
    
    if (!profile) {
      // 首次登录，创建业务档案
      console.log(`🔄 Creating profile for new user: ${session.user.email}`);
      profile = await UserProfile.create({
        userId: session.user.id,
        plan: "free",
        credits: {
          balance: 60,
          totalEarned: 60,
          totalSpent: 0,
          lastCreditGrant: {
            date: new Date(),
            amount: 60,
            reason: "welcome_bonus"
          }
        },
        subscriptionStatus: "inactive",
        preferences: {
          defaultStyle: "anime",
          defaultFormat: "png",
          autoSave: true,
          emailNotifications: true,
          theme: "light"
        },
        totalAvatarsCreated: 0,
        lastLoginAt: new Date()
      });
      console.log(`✅ Profile created for user: ${session.user.email}`);
    } else {
      // 更新最后登录时间
      profile.lastLoginAt = new Date();
      await profile.save();
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      profile: {
        plan: profile.plan,
        credits: profile.credits,
        subscriptionStatus: profile.subscriptionStatus,
        preferences: profile.preferences,
        totalAvatarsCreated: profile.totalAvatarsCreated,
        lastLoginAt: profile.lastLoginAt,
      }
    };
  } catch (error) {
    console.error("💥 Error getting current user:", error);
    return null;
  }
}

// 通过用户ID获取业务档案
export async function getUserProfile(userId: string) {
  try {
    await connectMongo();
    
    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      // 自动创建档案
      profile = await UserProfile.create({
        userId,
        plan: "free",
        credits: {
          balance: 60,
          totalEarned: 60,
          totalSpent: 0,
          lastCreditGrant: {
            date: new Date(),
            amount: 60,
            reason: "welcome_bonus"
          }
        },
        subscriptionStatus: "inactive",
        preferences: {
          defaultStyle: "anime",
          defaultFormat: "png",
          autoSave: true,
          emailNotifications: true,
          theme: "light"
        },
        totalAvatarsCreated: 0,
        lastLoginAt: new Date()
      });
    }
    
    return profile;
  } catch (error) {
    console.error("💥 Error getting user profile:", error);
    throw error;
  }
}

// 更新用户偏好
export async function updateUserPreferences(userId: string, preferences: any) {
  try {
    await connectMongo();
    
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          preferences: { ...preferences },
          lastLoginAt: new Date() 
        } 
      },
      { new: true, upsert: true }
    );
    
    return profile;
  } catch (error) {
    console.error("💥 Error updating user preferences:", error);
    throw error;
  }
}

// 添加积分
export async function grantCredits(userId: string, amount: number, reason: string = "manual_grant") {
  try {
    await connectMongo();
    
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
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
          lastLoginAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );
    
    return profile;
  } catch (error) {
    console.error("💥 Error granting credits:", error);
    throw error;
  }
}

// 消费积分
export async function consumeCredits(userId: string, amount: number) {
  try {
    await connectMongo();
    
    const profile = await UserProfile.findOne({ userId });
    
    if (!profile || profile.credits.balance < amount) {
      throw new Error("Insufficient credits");
    }
    
    profile.credits.balance -= amount;
    profile.credits.totalSpent += amount;
    profile.lastLoginAt = new Date();
    
    await profile.save();
    
    return profile;
  } catch (error) {
    console.error("💥 Error consuming credits:", error);
    throw error;
  }
}

export default {
  getCurrentUser,
  getUserProfile,
  updateUserPreferences,
  grantCredits,
  consumeCredits,
};
