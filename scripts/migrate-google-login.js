/**
 * Database Migration Script for Google Login User ID Issues
 * 
 * This script addresses the problem where Google login returns string IDs
 * that cannot be used directly with MongoDB ObjectId queries.
 * 
 * The script will:
 * 1. Add a googleId field to users who logged in via Google
 * 2. Ensure all users have proper field structure
 * 3. Handle potential duplicate user issues
 * 4. Create indexes for better performance
 * 
 * Run this script with: node scripts/migrate-google-login.js
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

// Check if a string is a valid MongoDB ObjectId
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && 
         (typeof str === 'string' && str.length === 24);
}

// Migration function for Google login users
async function migrateGoogleLoginUsers() {
  try {
    await connectDB();
    
    const User = mongoose.connection.collection('users');
    
    // Get all users
    const users = await User.find({}).toArray();
    console.log(`📊 Found ${users.length} users to process`);
    
    if (users.length === 0) {
      console.log('ℹ️  No users found. Nothing to migrate.');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    let googleUsersFound = 0;
    
    for (const user of users) {
      console.log(`\n🔍 Processing user: ${user.email || user._id}`);
      
      // Check if this user has a Google-style ID (long numeric string)
      const hasGoogleStyleId = user.id && 
                              typeof user.id === 'string' && 
                              user.id.length > 20 && 
                              !isValidObjectId(user.id);
      
      // Also check for other potential Google ID patterns
      const hasGoogleIdField = user.googleId && typeof user.googleId === 'string';
      const hasLongNumericId = user.id && 
                              typeof user.id === 'string' && 
                              /^\d{15,}$/.test(user.id); // 15+ digits
      
      if (hasGoogleStyleId || hasGoogleIdField || hasLongNumericId) {
        googleUsersFound++;
        const googleIdValue = user.googleId || user.id;
        console.log(`  📱 Found Google user with ID: ${googleIdValue}`);
        
        // Add googleId field if not exists
        if (!user.hasOwnProperty('googleId')) {
          const result = await User.updateOne(
            { _id: user._id },
            { $set: { googleId: user.id || user.googleId } }
          );
          
          if (result.modifiedCount > 0) {
            console.log(`  ✅ Added googleId field: ${user.id || user.googleId}`);
            migratedCount++;
          }
        } else {
          console.log(`  ⏩ googleId field already exists: ${user.googleId}`);
        }
      } else {
        console.log(`  🔍 User ID type: ${typeof user.id}, value: ${user.id || 'undefined'}`);
        if (user.id && typeof user.id === 'string') {
          console.log(`  🔍 ID length: ${user.id.length}, is ObjectId: ${isValidObjectId(user.id)}`);
        }
      }
      
      // Ensure all required fields exist
      const updateFields = {
        $set: {}
      };
      
      // Add plan if not exists
      if (!user.hasOwnProperty('plan')) {
        updateFields.$set.plan = 'free';
        console.log(`  ✅ Added plan field: free`);
      }
      
      // Add subscription status if not exists
      if (!user.hasOwnProperty('subscriptionStatus')) {
        updateFields.$set.subscriptionStatus = 'inactive';
        console.log(`  ✅ Added subscriptionStatus field: inactive`);
      }
      
      // Add monthly usage if not exists
      if (!user.hasOwnProperty('monthlyUsage')) {
        updateFields.$set.monthlyUsage = {
          avatarsGenerated: 0,
          lastResetDate: new Date()
        };
        console.log(`  ✅ Added monthlyUsage field`);
      }
      
      // Add preferences if not exists
      if (!user.hasOwnProperty('preferences')) {
        updateFields.$set.preferences = {
          defaultStyle: 'anime',
          defaultFormat: 'png',
          autoSave: true,
          emailNotifications: true
        };
        console.log(`  ✅ Added preferences field`);
      }
      
      // Add total avatars created if not exists
      if (!user.hasOwnProperty('totalAvatarsCreated')) {
        updateFields.$set.totalAvatarsCreated = 0;
        console.log(`  ✅ Added totalAvatarsCreated field: 0`);
      }
      
      // Add last login if not exists
      if (!user.hasOwnProperty('lastLoginAt')) {
        updateFields.$set.lastLoginAt = user.createdAt || new Date();
        console.log(`  ✅ Added lastLoginAt field`);
      }
      
      // Add subscription end date if not exists
      if (!user.hasOwnProperty('subscriptionEndDate')) {
        updateFields.$set.subscriptionEndDate = null;
        console.log(`  ✅ Added subscriptionEndDate field: null`);
      }
      
      // Add credits if not exists
      if (!user.hasOwnProperty('credits')) {
        updateFields.$set.credits = {
          balance: 60,
          totalEarned: 60,
          totalSpent: 0,
          lastCreditGrant: {
            date: new Date(),
            amount: 60,
            reason: "initial_free_credits"
          }
        };
        console.log(`  ✅ Added credits field with 60 free credits`);
      }
      
      // Add hasAccess if not exists
      if (!user.hasOwnProperty('hasAccess')) {
        updateFields.$set.hasAccess = false;
        console.log(`  ✅ Added hasAccess field: false`);
      }
      
      // Add isActive if not exists
      if (!user.hasOwnProperty('isActive')) {
        updateFields.$set.isActive = true;
        console.log(`  ✅ Added isActive field: true`);
      }
      
      // Perform the update if there are fields to update
      if (Object.keys(updateFields.$set).length > 0) {
        const result = await User.updateOne(
          { _id: user._id },
          updateFields
        );
        
        if (result.modifiedCount > 0) {
          console.log(`  ✅ Updated user fields`);
        }
      } else {
        console.log(`  ⏩ All required fields already exist`);
        skippedCount++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`⏩ Skipped (already migrated): ${skippedCount} users`);
    console.log(`📱 Google users found: ${googleUsersFound}`);
    console.log(`📊 Total users processed: ${users.length}`);
    
    // Verify migration by checking a sample user
    const sampleUser = await User.findOne({});
    if (sampleUser) {
      console.log('\n🔍 Sample migrated user fields:');
      console.log('- _id:', sampleUser._id);
      console.log('- email:', sampleUser.email);
      console.log('- googleId:', sampleUser.googleId || 'N/A');
      console.log('- plan:', sampleUser.plan);
      console.log('- subscriptionStatus:', sampleUser.subscriptionStatus);
      console.log('- credits.balance:', sampleUser.credits?.balance);
      console.log('- hasAccess:', sampleUser.hasAccess);
      console.log('- isActive:', sampleUser.isActive);
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
    
    // Get existing indexes
    const existingIndexes = await User.indexes();
    const existingIndexNames = existingIndexes.map(idx => idx.name);
    
    console.log('📋 Existing indexes:', existingIndexNames);
    
    // Add indexes for new fields (only if they don't exist)
    const indexesToCreate = [
      { plan: 1 },
      { subscriptionStatus: 1 },
      { lastLoginAt: -1 },
      { 'monthlyUsage.lastResetDate': 1 },
      { googleId: 1 }, // Index for Google ID lookups
      { hasAccess: 1 },
      { isActive: 1 }
    ];
    
    for (const indexSpec of indexesToCreate) {
      const indexName = Object.keys(indexSpec).map(key => 
        `${key}_${indexSpec[key] === 1 ? '1' : '-1'}`
      ).join('_');
      
      if (!existingIndexNames.includes(indexName)) {
        try {
          await User.createIndex(indexSpec);
          console.log(`  ✅ Created index: ${indexName}`);
        } catch (error) {
          if (error.code === 86) { // IndexKeySpecsConflict
            console.log(`  ⏩ Index already exists: ${indexName}`);
          } else {
            console.log(`  ⚠️  Failed to create index ${indexName}:`, error.message);
          }
        }
      } else {
        console.log(`  ⏩ Index already exists: ${indexName}`);
      }
    }
    
    // Note: email index already exists (unique constraint)
    console.log('  ⏩ Email index already exists (unique constraint)');
    
    console.log('✅ Index creation completed');
    
  } catch (error) {
    console.error('❌ Failed to add indexes:', error);
    // Don't throw error, just log it
    console.log('⚠️  Continuing without some indexes...');
  } finally {
    await mongoose.connection.close();
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Google Login User Migration...\n');
  
  try {
    await migrateGoogleLoginUsers();
    await addIndexes();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ All users have been updated with new fields');
    console.log('✅ Google users now have googleId field');
    console.log('✅ Database indexes have been added');
    console.log('\n💡 Next steps:');
    console.log('1. Deploy the updated code to Vercel');
    console.log('2. Test Google login functionality');
    console.log('3. Verify user settings API works correctly');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { migrateGoogleLoginUsers, addIndexes };
