/**
 * 迁移脚本：从自定义User模型迁移到标准NextAuth + UserProfile架构
 * 
 * 这个脚本会：
 * 1. 清空旧的users集合（如果存在）
 * 2. 让NextAuth重新创建标准的用户表结构
 * 3. 为现有用户创建UserProfile记录
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MONGODB_URI to .env.local');
  }
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
}

async function migrateToStandardAuth() {
  try {
    await connectDB();
    
    console.log('🚀 Starting migration to standard NextAuth architecture...\n');
    
    // 获取直接的数据库连接
    const db = mongoose.connection.db;
    
    // 1. 检查现有的用户数据
    const oldUsers = await db.collection('users').find({}).toArray();
    console.log(`📊 Found ${oldUsers.length} existing users`);
    
    if (oldUsers.length > 0) {
      console.log('📋 Sample existing user structure:');
      console.log(JSON.stringify(oldUsers[0], null, 2));
    }
    
    // 2. 备份现有用户数据到UserProfile集合
    if (oldUsers.length > 0) {
      console.log('\n🔄 Creating UserProfile records for existing users...');
      
      for (const oldUser of oldUsers) {
        try {
          // 创建UserProfile记录
          const profileData = {
            userId: oldUser._id.toString(), // 将原用户ID作为userId
            plan: oldUser.plan || "free",
            credits: oldUser.credits || {
              balance: 60,
              totalEarned: 60,
              totalSpent: 0,
              lastCreditGrant: {
                date: new Date(),
                amount: 60,
                reason: "migration_bonus"
              }
            },
            subscriptionStatus: oldUser.subscriptionStatus || "inactive",
            subscriptionEndDate: oldUser.subscriptionEndDate,
            subscriptionStartDate: oldUser.subscriptionStartDate,
            monthlyUsage: oldUser.monthlyUsage || {
              avatarsGenerated: 0,
              lastResetDate: new Date()
            },
            preferences: oldUser.preferences || {
              defaultStyle: "anime",
              defaultFormat: "png",
              autoSave: true,
              emailNotifications: true,
              theme: "light"
            },
            totalAvatarsCreated: oldUser.totalAvatarsCreated || 0,
            lastLoginAt: oldUser.lastLoginAt || oldUser.createdAt || new Date(),
            customerId: oldUser.customerId,
            priceId: oldUser.priceId,
            hasAccess: oldUser.hasAccess || false,
            createdAt: oldUser.createdAt || new Date(),
            updatedAt: new Date()
          };
          
          // 插入或更新UserProfile
          await db.collection('userprofiles').replaceOne(
            { userId: oldUser._id.toString() },
            profileData,
            { upsert: true }
          );
          
          console.log(`  ✅ Migrated profile for user: ${oldUser.email || oldUser._id}`);
        } catch (error) {
          console.error(`  ❌ Error migrating user ${oldUser.email || oldUser._id}:`, error.message);
        }
      }
    }
    
    // 3. 清空旧的users集合，让NextAuth重新创建
    console.log('\n🗑️ Clearing old users collection for NextAuth...');
    await db.collection('users').deleteMany({});
    
    // 4. 清理NextAuth相关的集合（如果存在）
    const nextAuthCollections = ['accounts', 'sessions', 'verificationtokens'];
    for (const collectionName of nextAuthCollections) {
      try {
        await db.collection(collectionName).deleteMany({});
        console.log(`  🧹 Cleared ${collectionName} collection`);
      } catch (error) {
        console.log(`  ℹ️ Collection ${collectionName} doesn't exist, skipping`);
      }
    }
    
    // 5. 创建必要的索引
    console.log('\n📊 Creating indexes...');
    await db.collection('userprofiles').createIndex({ userId: 1 }, { unique: true });
    await db.collection('userprofiles').createIndex({ plan: 1 });
    await db.collection('userprofiles').createIndex({ subscriptionStatus: 1 });
    console.log('  ✅ UserProfile indexes created');
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📋 Summary:');
    console.log(`  • Migrated ${oldUsers.length} user profiles`);
    console.log(`  • Cleared NextAuth collections for fresh start`);
    console.log(`  • Created necessary indexes`);
    console.log('\n🔄 Next steps:');
    console.log('  1. Deploy the updated code to production');
    console.log('  2. Test Google login - it will create new NextAuth users');
    console.log('  3. User profiles will be automatically linked by userId');
    console.log('  4. Verify with /api/user/settings-new endpoint');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// 检查模式
async function checkCurrentState() {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    
    console.log('🔍 Current database state:');
    
    // 检查集合
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Collections:');
    collections.forEach(col => {
      console.log(`  • ${col.name}`);
    });
    
    // 检查用户数据
    const userCount = await db.collection('users').countDocuments();
    const profileCount = await db.collection('userprofiles').countDocuments();
    const accountCount = await db.collection('accounts').countDocuments();
    
    console.log('\n📊 Document counts:');
    console.log(`  • users: ${userCount}`);
    console.log(`  • userprofiles: ${profileCount}`);
    console.log(`  • accounts: ${accountCount}`);
    
    if (userCount > 0) {
      const sampleUser = await db.collection('users').findOne();
      console.log('\n👤 Sample user structure:');
      console.log(JSON.stringify(sampleUser, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Check failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// 命令行参数处理
const command = process.argv[2];

if (command === 'check') {
  console.log('🔍 Checking current database state...\n');
  checkCurrentState();
} else if (command === 'migrate') {
  console.log('🚀 Starting migration...\n');
  migrateToStandardAuth();
} else {
  console.log('📋 Usage:');
  console.log('  node scripts/migrate-to-standard-auth.js check   # Check current state');
  console.log('  node scripts/migrate-to-standard-auth.js migrate # Run migration');
  process.exit(1);
}
