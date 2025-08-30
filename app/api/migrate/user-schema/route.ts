import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// POST /api/migrate/user-schema - Migrate existing users to new schema
export async function POST() {
  try {
    await connectMongo();
    
    // Get all users that need migration
    const users = await User.find({
      $or: [
        { plan: { $exists: false } },
        { monthlyUsage: { $exists: false } },
        { preferences: { $exists: false } },
        { totalAvatarsCreated: { $exists: false } }
      ]
    });
    
    console.log(`Found ${users.length} users to migrate`);
    
    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users need migration",
        migratedCount: 0
      });
    }
    
    let migratedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      
      // Add plan if missing
      if (!user.plan) {
        user.plan = "free";
        needsUpdate = true;
      }
      
      // Add subscription status if missing
      if (!user.subscriptionStatus) {
        user.subscriptionStatus = "inactive";
        needsUpdate = true;
      }
      
      // Add monthly usage if missing
      if (!user.monthlyUsage) {
        user.monthlyUsage = {
          avatarsGenerated: 0,
          lastResetDate: new Date()
        };
        needsUpdate = true;
      }
      
      // Add preferences if missing
      if (!user.preferences) {
        user.preferences = {
          defaultStyle: "anime",
          defaultFormat: "png",
          autoSave: true,
          emailNotifications: true
        };
        needsUpdate = true;
      }
      
      // Add total avatars created if missing
      if (user.totalAvatarsCreated === undefined) {
        user.totalAvatarsCreated = 0;
        needsUpdate = true;
      }
      
      // Add last login if missing
      if (!user.lastLoginAt) {
        user.lastLoginAt = user.createdAt || new Date();
        needsUpdate = true;
      }
      
      // Add subscription end date if missing
      if (user.subscriptionEndDate === undefined) {
        user.subscriptionEndDate = null;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
        migratedCount++;
        console.log(`Migrated user: ${user.email || user._id}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedCount} users`,
      migratedCount,
      totalUsers: users.length
    });
    
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Migration failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// GET /api/migrate/user-schema - Check migration status
export async function GET() {
  try {
    await connectMongo();
    
    // Count total users
    const totalUsers = await User.countDocuments({});
    
    // Count users that need migration
    const usersNeedingMigration = await User.countDocuments({
      $or: [
        { plan: { $exists: false } },
        { monthlyUsage: { $exists: false } },
        { preferences: { $exists: false } },
        { totalAvatarsCreated: { $exists: false } }
      ]
    });
    
    // Count migrated users
    const migratedUsers = await User.countDocuments({
      plan: { $exists: true },
      monthlyUsage: { $exists: true },
      preferences: { $exists: true },
      totalAvatarsCreated: { $exists: true }
    });
    
    // Get sample migrated user for verification
    const sampleUser = await User.findOne({
      plan: { $exists: true },
      monthlyUsage: { $exists: true },
      preferences: { $exists: true }
    }).select("plan monthlyUsage preferences totalAvatarsCreated lastLoginAt");
    
    return NextResponse.json({
      migrationStatus: {
        totalUsers,
        migratedUsers,
        usersNeedingMigration,
        migrationComplete: usersNeedingMigration === 0
      },
      sampleUser: sampleUser ? {
        plan: sampleUser.plan,
        monthlyUsage: sampleUser.monthlyUsage,
        preferences: sampleUser.preferences,
        totalAvatarsCreated: sampleUser.totalAvatarsCreated,
        lastLoginAt: sampleUser.lastLoginAt
      } : null
    });
    
  } catch (error) {
    console.error("Migration status check error:", error);
    return NextResponse.json(
      { 
        error: "Failed to check migration status", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}