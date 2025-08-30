image.png/**
 * Database Migration Script for User Schema Updates
 * 
 * This script migrates existing User records to include the new PngTuber-specific fields:
 * - plan (default: "free")
 * - subscriptionStatus (default: "inactive")
 * - monthlyUsage with avatarsGenerated and lastResetDate
 * - preferences with default values
 * - totalAvatarsCreated (default: 0)
 * - lastLoginAt (current timestamp)
 * - subscriptionEndDate (null)
 * 
 * Run this script with: node scripts/migrate-user-schema.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
}

// Migration function
async function migrateUserSchema() {
  try {
    await connectDB();
    
    const User = mongoose.connection.collection('users');
    
    // Get all users
    const users = await User.find({}).toArray();
    console.log(`📊 Found ${users.length} users to migrate`);
    
    if (users.length === 0) {
      console.log('ℹ️  No users found. Nothing to migrate.');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      // Check if user already has the new fields (partial migration check)
      const needsMigration = !user.hasOwnProperty('plan') || 
                            !user.hasOwnProperty('monthlyUsage') || 
                            !user.hasOwnProperty('preferences');
      
      if (!needsMigration) {
        console.log(`⏩ Skipping user ${user.email || user._id} - already migrated`);
        skippedCount++;
        continue;
      }
      
      // Prepare update object with new fields
      const updateFields = {
        $set: {}
      };
      
      // Add plan if not exists
      if (!user.hasOwnProperty('plan')) {
        updateFields.$set.plan = 'free';
      }
      
      // Add subscription status if not exists
      if (!user.hasOwnProperty('subscriptionStatus')) {
        updateFields.$set.subscriptionStatus = 'inactive';
      }
      
      // Add monthly usage if not exists
      if (!user.hasOwnProperty('monthlyUsage')) {
        updateFields.$set.monthlyUsage = {
          avatarsGenerated: 0,
          lastResetDate: new Date()
        };
      }
      
      // Add preferences if not exists
      if (!user.hasOwnProperty('preferences')) {
        updateFields.$set.preferences = {
          defaultStyle: 'anime',
          defaultFormat: 'png',
          autoSave: true,
          emailNotifications: true
        };
      }
      
      // Add total avatars created if not exists
      if (!user.hasOwnProperty('totalAvatarsCreated')) {
        updateFields.$set.totalAvatarsCreated = 0;
      }
      
      // Add last login if not exists
      if (!user.hasOwnProperty('lastLoginAt')) {
        updateFields.$set.lastLoginAt = user.createdAt || new Date();
      }
      
      // Add subscription end date if not exists
      if (!user.hasOwnProperty('subscriptionEndDate')) {
        updateFields.$set.subscriptionEndDate = null;
      }
      
      // Perform the update
      const result = await User.updateOne(
        { _id: user._id },
        updateFields
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Migrated user: ${user.email || user._id}`);
        migratedCount++;
      } else {
        console.log(`⚠️  No changes needed for user: ${user.email || user._id}`);
        skippedCount++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`⏩ Skipped (already migrated): ${skippedCount} users`);
    console.log(`📊 Total users processed: ${users.length}`);
    
    // Verify migration by checking a sample user
    const sampleUser = await User.findOne({});
    if (sampleUser) {
      console.log('\n🔍 Sample migrated user fields:');
      console.log('- plan:', sampleUser.plan);
      console.log('- subscriptionStatus:', sampleUser.subscriptionStatus);
      console.log('- monthlyUsage:', sampleUser.monthlyUsage);
      console.log('- preferences:', sampleUser.preferences);
      console.log('- totalAvatarsCreated:', sampleUser.totalAvatarsCreated);
      console.log('- lastLoginAt:', sampleUser.lastLoginAt);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Add indexes for better performance after migration
async function addIndexes() {
  try {
    await connectDB();
    
    const User = mongoose.connection.collection('users');
    
    console.log('📈 Adding database indexes...');
    
    // Add indexes for new fields
    await User.createIndex({ plan: 1 });
    await User.createIndex({ subscriptionStatus: 1 });
    await User.createIndex({ lastLoginAt: -1 });
    await User.createIndex({ 'monthlyUsage.lastResetDate': 1 });
    
    console.log('✅ Indexes added successfully');
    
  } catch (error) {
    console.error('❌ Failed to add indexes:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting User Schema Migration...\n');
  
  try {
    await migrateUserSchema();
    await addIndexes();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ All users have been updated with new PngTuber fields');
    console.log('✅ Database indexes have been added');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { migrateUserSchema, addIndexes };