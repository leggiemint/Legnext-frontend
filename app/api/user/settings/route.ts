import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

// GET /api/user/settings - 获取用户设置和使用数据（标准架构）
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
        totalAvatarsCreated: user.profile.imagesGenerated,
        preferences: user.profile.preferences,
      },
      credits: {
        balance: user.profile.credits,
        totalEarned: user.profile.totalCreditsEarned,
        totalSpent: user.profile.totalCreditsSpent,
        lastCreditGrant: {
          date: new Date().toISOString(), // 临时，后续可以从交易记录获取
          amount: 60,
          reason: "Welcome bonus credits"
        }
      },
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

// PUT /api/user/settings - 更新用户偏好设置
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      await prisma.userProfile.update({
        where: { userId: user.id },
        data: {
          preferences: {
            ...user.profile.preferences,
            ...preferences,
          }
        }
      });
    }

    // 返回更新后的用户信息
    const updatedUser = await getUserWithProfile(user.id);

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
