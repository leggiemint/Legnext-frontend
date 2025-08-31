/**
 * Migration Script: User Model to UserProfile Model Credit Sync
 * 
 * This script migrates existing user data from the User model to UserProfile model
 * to fix the credit display issue for PRO users.
 * 
 * IMPORTANT: Run this script in production to sync existing user data!
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('../models/User').default;
const UserProfile = require('../models/UserProfile').default;

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function migrateUsersToProfiles() {
  console.log('🔄 Starting User to UserProfile migration...');
  
  try {
    // Get all users from User collection
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to potentially migrate`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        console.log(`\n👤 Processing user: ${user.email || user._id}`);
        
        // Check if UserProfile already exists
        const existingProfile = await UserProfile.findOne({ userId: user._id.toString() });
        
        if (existingProfile) {
          console.log(`   📋 Checking data consistency...`);
          
          // Check if data needs to be updated
          const needsUpdate = (
            existingProfile.plan !== user.plan ||
            existingProfile.subscriptionStatus !== user.subscriptionStatus ||
            existingProfile.credits.balance !== user.credits.balance ||
            existingProfile.credits.totalEarned !== user.credits.totalEarned ||
            existingProfile.credits.totalSpent !== user.credits.totalSpent
          );
          
          if (needsUpdate) {
            console.log(`   🔄 Updating existing profile with User model data...`);
            console.log(`   📊 Current profile: plan=${existingProfile.plan}, credits=${existingProfile.credits.balance}`);
            console.log(`   📊 User model data: plan=${user.plan}, credits=${user.credits.balance}`);
            
            // Update existing profile with User model data (User model is the source of truth)
            await UserProfile.findOneAndUpdate(
              { userId: user._id.toString() },
              {
                $set: {
                  plan: user.plan || existingProfile.plan,
                  subscriptionStatus: user.subscriptionStatus || existingProfile.subscriptionStatus,
                  subscriptionStartDate: user.subscriptionStartDate || existingProfile.subscriptionStartDate,
                  subscriptionEndDate: user.subscriptionEndDate || existingProfile.subscriptionEndDate,
                  'credits.balance': user.credits?.balance || existingProfile.credits.balance,
                  'credits.totalEarned': user.credits?.totalEarned || existingProfile.credits.totalEarned,
                  'credits.totalSpent': user.credits?.totalSpent || existingProfile.credits.totalSpent,
                  'credits.lastCreditGrant': user.credits?.lastCreditGrant || existingProfile.credits.lastCreditGrant,
                  monthlyUsage: user.monthlyUsage || existingProfile.monthlyUsage,
                  preferences: {
                    ...existingProfile.preferences,
                    ...user.preferences
                  },
                  totalAvatarsCreated: user.totalAvatarsCreated || existingProfile.totalAvatarsCreated,
                  lastLoginAt: user.lastLoginAt || existingProfile.lastLoginAt,
                  customerId: user.customerId || existingProfile.customerId,
                  priceId: user.priceId || existingProfile.priceId,
                  hasAccess: user.hasAccess !== undefined ? user.hasAccess : existingProfile.hasAccess,
                }
              },
              { new: true }
            );
            
            console.log(`   ✅ Updated existing profile for user: ${user.email || user._id}`);
            migrated++;
          } else {
            console.log(`   ✅ Profile already up to date, skipping...`);
            skipped++;
          }
        } else {
          console.log(`   🆕 Creating new UserProfile from User data...`);
          console.log(`   📊 User data: plan=${user.plan}, credits=${user.credits?.balance || 'N/A'}`);
          
          // Create new UserProfile with User model data
          const profileData = {
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
          };
          
          await UserProfile.create(profileData);
          console.log(`   ✅ Created new profile for user: ${user.email || user._id}`);
          migrated++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing user ${user.email || user._id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated/Updated: ${migrated} users`);
    console.log(`   ⏭️  Skipped: ${skipped} users`);
    console.log(`   ❌ Errors: ${errors} users`);
    console.log(`   📋 Total processed: ${users.length} users`);
    
    if (errors === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please review the log above.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    // Check for PRO users
    const proUsers = await User.find({ plan: "pro" });
    console.log(`📊 Found ${proUsers.length} PRO users in User model`);
    
    for (const user of proUsers.slice(0, 3)) { // Check first 3 PRO users
      const profile = await UserProfile.findOne({ userId: user._id.toString() });
      
      if (profile) {
        console.log(`✅ PRO user ${user.email || user._id}:`);
        console.log(`   User model: plan=${user.plan}, credits=${user.credits?.balance}`);
        console.log(`   UserProfile: plan=${profile.plan}, credits=${profile.credits.balance}`);
        
        if (profile.plan === user.plan && profile.credits.balance === user.credits?.balance) {
          console.log(`   ✅ Data synchronized correctly`);
        } else {
          console.log(`   ⚠️  Data mismatch detected`);
        }
      } else {
        console.log(`❌ No UserProfile found for PRO user ${user.email || user._id}`);
      }
    }
    
    // Check total counts
    const totalUsers = await User.countDocuments();
    const totalProfiles = await UserProfile.countDocuments();
    
    console.log(`\n📊 Final counts:`);
    console.log(`   Users: ${totalUsers}`);
    console.log(`   UserProfiles: ${totalProfiles}`);
    
    if (totalUsers === totalProfiles) {
      console.log(`   ✅ Counts match perfectly!`);
    } else {
      console.log(`   ⚠️  Count mismatch - this may be normal if some users don't need profiles`);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

async function main() {
  console.log('🚀 User to UserProfile Migration Script');
  console.log('=====================================');
  console.log('This script will sync data from User model to UserProfile model');
  console.log('to fix credit display issues for PRO users.\n');
  
  try {
    await connectToDatabase();
    await migrateUsersToProfiles();
    await verifyMigration();
    
    console.log('\n✅ Migration script completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the application to ensure PRO users see correct credits');
    console.log('   2. Monitor webhook processing for new subscriptions');
    console.log('   3. Consider the UserProfile model as the primary data source going forward');
    
  } catch (error) {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  console.log('⚠️  IMPORTANT: Make sure you have a database backup before running this migration!');
  console.log('⚠️  This script will modify your production database.');
  console.log('\n🔧 To run the migration, uncomment the line below:');
  console.log('// main();');
  console.log('\n📖 Or run with: node scripts/migrate-user-to-userprofile.js');
  
  // Uncomment the line below to run the migration
  // main();
}

module.exports = { main, migrateUsersToProfiles, verifyMigration };
