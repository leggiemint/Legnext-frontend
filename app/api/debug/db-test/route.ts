import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// GET /api/debug/db-test - Test database connection and basic operations
export async function GET() {
  try {
    console.log("🔍 [DEBUG] Testing database connection...");
    
    // Test MongoDB connection with timeout
    const connectionPromise = connectMongo();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Connection timeout after 5 seconds")), 5000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log("✅ [DEBUG] MongoDB connection successful");
    
    // Test basic user query with timeout
    const userCountPromise = User.countDocuments();
    const countTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Count query timeout after 5 seconds")), 5000)
    );
    
    const userCount = await Promise.race([userCountPromise, countTimeoutPromise]);
    console.log(`✅ [DEBUG] User count: ${userCount}`);
    
    // Test sample user query with timeout
    const sampleUserPromise = User.findOne({});
    const userTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("User query timeout after 5 seconds")), 5000)
    );
    
    const sampleUser = await Promise.race([sampleUserPromise, userTimeoutPromise]);
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
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
