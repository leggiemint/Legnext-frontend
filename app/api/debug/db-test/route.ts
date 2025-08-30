import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// GET /api/debug/db-test - Test database connection and basic operations
export async function GET() {
  try {
    console.log("🔍 [DEBUG] Testing database connection...");
    
    // Test MongoDB connection
    await connectMongo();
    console.log("✅ [DEBUG] MongoDB connection successful");
    
    // Test basic user query
    const userCount = await User.countDocuments();
    console.log(`✅ [DEBUG] User count: ${userCount}`);
    
    // Test sample user query
    const sampleUser = await User.findOne({});
    if (sampleUser) {
      console.log("✅ [DEBUG] Sample user found:", {
        _id: sampleUser._id,
        email: sampleUser.email,
        plan: sampleUser.plan,
        hasGoogleId: !!sampleUser.googleId
      });
    } else {
      console.log("⚠️ [DEBUG] No users found in database");
    }
    
    return NextResponse.json({
      success: true,
      message: "Database connection test successful",
      userCount,
      sampleUser: sampleUser ? {
        _id: sampleUser._id,
        email: sampleUser.email,
        plan: sampleUser.plan,
        hasGoogleId: !!sampleUser.googleId
      } : null
    });
    
  } catch (error) {
    console.error("💥 [DEBUG] Database test failed:", {
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Database test failed", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
