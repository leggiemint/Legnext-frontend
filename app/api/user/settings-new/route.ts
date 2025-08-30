import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, updateUserPreferences } from "@/libs/user-service";

// GET /api/user/settings-new - 获取用户设置和使用数据（标准架构）
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`✅ User data fetched successfully: ${user.email}`);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        plan: user.profile.plan,
        subscriptionStatus: user.profile.subscriptionStatus,
        totalAvatarsCreated: user.profile.totalAvatarsCreated,
        lastLoginAt: user.profile.lastLoginAt,
        preferences: user.profile.preferences,
      },
      credits: user.profile.credits,
      planLimits: {
        creditsPerMonth: user.profile.plan === "pro" ? 260 : 0,
        animationsAllowed: user.profile.plan === "pro",
        hdExportsAllowed: user.profile.plan === "pro",
        watermarkFree: user.profile.plan === "pro",
        commercialUse: user.profile.plan === "pro",
      },
      subscription: {
        isActive: user.profile.subscriptionStatus === "active",
        plan: user.profile.plan,
        endDate: null, // 从profile中获取如果需要
      },
    });
  } catch (error) {
    console.error("💥 Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/user/settings-new - 更新用户偏好设置
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { preferences } = body;

    // 验证偏好设置结构
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

    // 更新偏好设置
    if (preferences) {
      await updateUserPreferences(user.id, {
        ...user.profile.preferences,
        ...preferences,
      });
    }

    // 返回更新后的用户信息
    const updatedUser = await getCurrentUser();

    return NextResponse.json({
      message: "Settings updated successfully",
      data: {
        user: {
          id: updatedUser!.id,
          name: updatedUser!.name,
          email: updatedUser!.email,
          image: updatedUser!.image,
          plan: updatedUser!.profile.plan,
          subscriptionStatus: updatedUser!.profile.subscriptionStatus,
          preferences: updatedUser!.profile.preferences,
          lastLoginAt: updatedUser!.profile.lastLoginAt,
        },
      },
    });
  } catch (error) {
    console.error("💥 Error updating user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
