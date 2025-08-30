import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserDashboardData, updateUserPreferences, updateUserProfile } from "@/libs/user";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// GET /api/user/settings - Fetch user settings and usage data
export async function GET() {
  let session;
  try {
    session = await getServerSession(authOptions);
    
    console.log("🔍 [DEBUG] Session data:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userIdType: typeof session?.user?.id
    });
    
    if (!session?.user?.id) {
      console.log("❌ [DEBUG] No session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 [DEBUG] Attempting to fetch user data...");
    const userData = await getUserDashboardData(session.user.id, session.user.email);

    if (!userData) {
      console.log("❌ [DEBUG] getUserDashboardData returned null");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ [DEBUG] User data fetched successfully:", {
      userId: userData.user.id,
      userEmail: userData.user.email,
      userPlan: userData.user.plan
    });

    return NextResponse.json(userData);
  } catch (error) {
    console.error("💥 [DEBUG] Error fetching user settings:", {
      error: error.message,
      stack: error.stack,
      session: !!session,
      userId: session?.user?.id
    });
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
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
      updatedUser = await updateUserPreferences(session.user.id, preferences, session.user.email);
    }
    
    if (profile) {
      updatedUser = await updateUserProfile(session.user.id, profile, session.user.email);
    }

    // If neither preferences nor profile were updated, just fetch current user
    if (!updatedUser) {
      const userData = await getUserDashboardData(session.user.id, session.user.email);
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

    let user = await User.findById(session.user.id);
    
    // 如果通过 ID 查询失败，尝试通过 email 查询
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }
    
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