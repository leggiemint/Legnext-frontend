import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { grantCreditsToUser } from "@/libs/user";

// Test endpoint to manually trigger user upgrade (for debugging)
export async function GET(req: NextRequest) {
  return POST();
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectMongo();
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Before update:", {
      userId: user._id,
      plan: user.plan,
      hasAccess: user.hasAccess,
      subscriptionStatus: user.subscriptionStatus,
      creditsBalance: user.credits.balance
    });

    // Simulate Pro upgrade
    user.plan = "pro";
    user.hasAccess = true;
    user.subscriptionStatus = "active";
    user.priceId = "price_test_manual";
    user.customerId = "cus_test_manual";
    
    await user.save();
    
    // Grant credits
    await grantCreditsToUser(user._id.toString(), 260, "manual_test_upgrade");
    
    // Re-fetch user to get updated data
    const updatedUser = await User.findById(session.user.id);
    
    console.log("After update:", {
      userId: updatedUser._id,
      plan: updatedUser.plan,
      hasAccess: updatedUser.hasAccess,
      subscriptionStatus: updatedUser.subscriptionStatus,
      creditsBalance: updatedUser.credits.balance,
      totalEarned: updatedUser.credits.totalEarned
    });

    return NextResponse.json({
      message: "User manually upgraded to Pro for testing",
      before: {
        plan: user.plan,
        hasAccess: user.hasAccess,
        creditsBalance: user.credits.balance
      },
      after: {
        plan: updatedUser.plan,
        hasAccess: updatedUser.hasAccess,
        subscriptionStatus: updatedUser.subscriptionStatus,
        creditsBalance: updatedUser.credits.balance,
        totalEarned: updatedUser.credits.totalEarned
      }
    });
  } catch (error) {
    console.error("Test user update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}