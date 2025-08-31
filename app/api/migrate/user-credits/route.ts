import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";

interface MigrationStats {
  totalUsers: number;
  migrated: number;
  skipped: number;
  errors: number;
  proUsersFound: number;
  proUsersMigrated: number;
}

// GET - Check migration status
export async function GET() {
  try {
    await connectMongo();
    
    const totalUsers = await User.countDocuments();
    const totalProfiles = await UserProfile.countDocuments();
    const proUsers = await User.countDocuments({ plan: "pro" });
    const proProfiles = await UserProfile.countDocuments({ plan: "pro" });
    
    // Check for data mismatches in PRO users
    const sampleProUsers = await User.find({ plan: "pro" }).limit(5);
    const mismatches = [];
    
    for (const user of sampleProUsers) {
      const profile = await UserProfile.findOne({ userId: user._id.toString() });
      if (profile) {
        if (
          profile.plan !== user.plan ||
          profile.credits.balance !== user.credits?.balance ||
          profile.subscriptionStatus !== user.subscriptionStatus
        ) {
          mismatches.push({
            userId: user._id.toString(),
            email: user.email,
            userModel: {
              plan: user.plan,
              credits: user.credits?.balance,
              status: user.subscriptionStatus
            },
            profileModel: {
              plan: profile.plan,
              credits: profile.credits.balance,
              status: profile.subscriptionStatus
            }
          });
        }
      } else {
        mismatches.push({
          userId: user._id.toString(),
          email: user.email,
          error: "No UserProfile found"
        });
      }
    }
    
    const needsMigration = mismatches.length > 0 || totalUsers !== totalProfiles;
    
    return NextResponse.json({
      status: needsMigration ? "migration_needed" : "up_to_date",
      summary: {
        totalUsers,
        totalProfiles,
        proUsers,
        proProfiles,
        needsMigration,
        dataMismatches: mismatches.length
      },
      mismatches: mismatches.slice(0, 3), // Show first 3 mismatches
      recommendation: needsMigration 
        ? "Run POST /api/migrate/user-credits to sync User model data to UserProfile model"
        : "No migration needed. All data appears to be synchronized."
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

// POST - Run the migration
export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    
    const stats: MigrationStats = {
      totalUsers: 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
      proUsersFound: 0,
      proUsersMigrated: 0
    };
    
    console.log('🔄 Starting User to UserProfile credit migration...');
    
    // Get all users
    const users = await User.find({});
    stats.totalUsers = users.length;
    
    const migrationLog: string[] = [];
    migrationLog.push(`📊 Found ${users.length} users to process`);
    
    for (const user of users) {
      try {
        const isProUser = user.plan === "pro";
        if (isProUser) stats.proUsersFound++;
        
        // Check if UserProfile exists
        const existingProfile = await UserProfile.findOne({ userId: user._id.toString() });
        
        if (existingProfile) {
          // Check if data needs updating
          const needsUpdate = (
            existingProfile.plan !== user.plan ||
            existingProfile.subscriptionStatus !== user.subscriptionStatus ||
            existingProfile.credits.balance !== user.credits?.balance ||
            existingProfile.credits.totalEarned !== user.credits?.totalEarned ||
            existingProfile.credits.totalSpent !== user.credits?.totalSpent
          );
          
          if (needsUpdate) {
            migrationLog.push(`🔄 Updating profile for ${user.email || user._id}: plan=${user.plan}, credits=${user.credits?.balance}`);
            
            await UserProfile.findOneAndUpdate(
              { userId: user._id.toString() },
              {
                $set: {
                  plan: user.plan || existingProfile.plan,
                  subscriptionStatus: user.subscriptionStatus || existingProfile.subscriptionStatus,
                  subscriptionStartDate: user.subscriptionStartDate || existingProfile.subscriptionStartDate,
                  subscriptionEndDate: user.subscriptionEndDate || existingProfile.subscriptionEndDate,
                  'credits.balance': user.credits?.balance !== undefined ? user.credits.balance : existingProfile.credits.balance,
                  'credits.totalEarned': user.credits?.totalEarned !== undefined ? user.credits.totalEarned : existingProfile.credits.totalEarned,
                  'credits.totalSpent': user.credits?.totalSpent !== undefined ? user.credits.totalSpent : existingProfile.credits.totalSpent,
                  'credits.lastCreditGrant': user.credits?.lastCreditGrant || existingProfile.credits.lastCreditGrant,
                  monthlyUsage: user.monthlyUsage || existingProfile.monthlyUsage,
                  preferences: {
                    ...existingProfile.preferences,
                    ...user.preferences
                  },
                  totalAvatarsCreated: user.totalAvatarsCreated !== undefined ? user.totalAvatarsCreated : existingProfile.totalAvatarsCreated,
                  lastLoginAt: user.lastLoginAt || existingProfile.lastLoginAt,
                  customerId: user.customerId || existingProfile.customerId,
                  priceId: user.priceId || existingProfile.priceId,
                  hasAccess: user.hasAccess !== undefined ? user.hasAccess : existingProfile.hasAccess,
                }
              }
            );
            
            stats.migrated++;
            if (isProUser) stats.proUsersMigrated++;
          } else {
            stats.skipped++;
          }
        } else {
          // Create new UserProfile
          migrationLog.push(`🆕 Creating profile for ${user.email || user._id}: plan=${user.plan}, credits=${user.credits?.balance || 60}`);
          
          await UserProfile.create({
            userId: user._id.toString(),
            plan: user.plan || "free",
            credits: user.credits || {
              balance: 60,
              totalEarned: 60,
              totalSpent: 0,
              lastCreditGrant: {
                date: new Date(),
                amount: 60,
                reason: "migration_from_user_model"
              }
            },
            subscriptionStatus: user.subscriptionStatus || "inactive",
            subscriptionStartDate: user.subscriptionStartDate,
            subscriptionEndDate: user.subscriptionEndDate,
            monthlyUsage: user.monthlyUsage || {
              avatarsGenerated: 0,
              lastResetDate: new Date()
            },
            preferences: user.preferences || {
              defaultStyle: "anime",
              defaultFormat: "png",
              autoSave: true,
              emailNotifications: true,
              theme: "light"
            },
            totalAvatarsCreated: user.totalAvatarsCreated || 0,
            lastLoginAt: user.lastLoginAt || user.createdAt || new Date(),
            customerId: user.customerId,
            priceId: user.priceId,
            hasAccess: user.hasAccess || false,
          });
          
          stats.migrated++;
          if (isProUser) stats.proUsersMigrated++;
        }
        
      } catch (error) {
        migrationLog.push(`❌ Error processing ${user.email || user._id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        stats.errors++;
      }
    }
    
    // Verification
    const finalUserCount = await User.countDocuments();
    const finalProfileCount = await UserProfile.countDocuments();
    
    migrationLog.push(`\n📊 Migration completed:`);
    migrationLog.push(`   ✅ Migrated/Updated: ${stats.migrated} users`);
    migrationLog.push(`   ⏭️  Skipped: ${stats.skipped} users`);
    migrationLog.push(`   ❌ Errors: ${stats.errors} users`);
    migrationLog.push(`   🎯 PRO users found: ${stats.proUsersFound}`);
    migrationLog.push(`   🎯 PRO users migrated: ${stats.proUsersMigrated}`);
    migrationLog.push(`   📋 Final counts: Users=${finalUserCount}, Profiles=${finalProfileCount}`);
    
    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      stats,
      log: migrationLog,
      recommendations: [
        "Test the application to ensure PRO users see correct credits",
        "Monitor webhook processing for new subscriptions",
        "UserProfile model is now the primary data source"
      ]
    });
    
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { 
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
