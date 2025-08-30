import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserDashboardData, updateUserPreferences, updateUserProfile } from "@/libs/user";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// GET /api/user/settings - Fetch user settings and usage data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await getUserDashboardData(session.user.id);

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/user/settings - Update user preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { preferences, profile } = body;

    // Validate preferences structure
    if (preferences) {
      const validStyles = ["anime", "realistic", "cartoon", "chibi"];
      const validFormats = ["png", "jpg", "webp"];

      if (preferences.defaultStyle && !validStyles.includes(preferences.defaultStyle)) {
        return NextResponse.json(
          { error: "Invalid default style" },
          { status: 400 }
        );
      }

      if (preferences.defaultFormat && !validFormats.includes(preferences.defaultFormat)) {
        return NextResponse.json(
          { error: "Invalid default format" },
          { status: 400 }
        );
      }
    }

    // Update preferences and profile using utility functions
    let updatedUser;
    if (preferences) {
      updatedUser = await updateUserPreferences(session.user.id, preferences);
    }
    
    if (profile) {
      updatedUser = await updateUserProfile(session.user.id, profile);
    }

    // If neither preferences nor profile were updated, just fetch current user
    if (!updatedUser) {
      const userData = await getUserDashboardData(session.user.id);
      updatedUser = userData?.user;
    }

    return NextResponse.json({
      message: "Settings updated successfully",
      data: {
        user: {
          id: updatedUser._id || updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.image,
          plan: updatedUser.plan, // 🔧 添加计划字段
          subscriptionStatus: updatedUser.subscriptionStatus, // 🔧 添加订阅状态
          preferences: updatedUser.preferences,
          lastLoginAt: updatedUser.lastLoginAt,
        },
      },
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/settings - Update specific user fields
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    await connectMongo();

    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (action) {
      case "increment_usage": {
        // Increment monthly avatar usage
        user.monthlyUsage.avatarsGenerated += 1;
        user.totalAvatarsCreated += 1;
        
        // Reset monthly usage if it's a new month
        const now = new Date();
        const lastReset = user.monthlyUsage.lastResetDate;
        if (!lastReset || 
            lastReset.getMonth() !== now.getMonth() || 
            lastReset.getFullYear() !== now.getFullYear()) {
          user.monthlyUsage.avatarsGenerated = 1;
          user.monthlyUsage.lastResetDate = now;
        }
        break;
      }

      case "update_login": {
        user.lastLoginAt = new Date();
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    await user.save();

    return NextResponse.json({
      message: "User data updated successfully",
      data: {
        monthlyUsage: user.monthlyUsage,
        totalAvatarsCreated: user.totalAvatarsCreated,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Error updating user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}