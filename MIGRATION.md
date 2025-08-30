# Database Migration Guide

## User Schema Migration

This project has been updated with new fields for the User model to support PngTuber functionality. If you have existing users in your database, you need to run the migration to add these new fields.

### New User Fields Added:
- `plan`: User's subscription plan ("free" or "pro")
- `subscriptionStatus`: Current subscription status
- `monthlyUsage`: Track monthly avatar generation usage
- `preferences`: User preferences for avatar generation
- `totalAvatarsCreated`: Total lifetime avatar count
- `lastLoginAt`: Track user activity
- `subscriptionEndDate`: When subscription ends

## Migration Methods

### Method 1: API Route Migration (Recommended for Development)

1. **Check migration status:**
   ```bash
   curl http://localhost:3000/api/migrate/user-schema
   ```

2. **Run the migration:**
   ```bash
   curl -X POST http://localhost:3000/api/migrate/user-schema
   ```

   Or visit in browser:
   - Check status: `http://localhost:3000/api/migrate/user-schema`
   - Run migration: Send POST request to `http://localhost:3000/api/migrate/user-schema`

### Method 2: Node.js Script Migration (Recommended for Production)

1. **Make sure your environment variables are set in `.env.local`:**
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

2. **Run the migration script:**
   ```bash
   node scripts/migrate-user-schema.js
   ```

## Migration Details

The migration will:

1. **Check existing users** for missing fields
2. **Add default values** for new fields:
   - `plan: "free"`
   - `subscriptionStatus: "inactive"`
   - `monthlyUsage: { avatarsGenerated: 0, lastResetDate: new Date() }`
   - `preferences: { defaultStyle: "anime", defaultFormat: "png", autoSave: true, emailNotifications: true }`
   - `totalAvatarsCreated: 0`
   - `lastLoginAt: user.createdAt || new Date()`
   - `subscriptionEndDate: null`
3. **Skip users** that already have these fields
4. **Add database indexes** for better performance
5. **Provide summary** of migrated users

## Verification

After running the migration, you can verify it worked by:

1. Checking the migration status API
2. Looking at a sample user in your database
3. Testing the `/api/user/settings` endpoint

## Safety Notes

- ✅ Migration is **safe** - it only adds new fields, doesn't modify existing data
- ✅ **Idempotent** - can be run multiple times safely
- ✅ **Non-destructive** - won't delete or overwrite existing user data
- ✅ **Rollback friendly** - new fields can be removed if needed

## Troubleshooting

If you encounter issues:

1. **Check MongoDB connection**: Ensure `MONGODB_URI` is correct
2. **Check permissions**: Make sure the database user has write permissions
3. **Check logs**: Look for detailed error messages in the console
4. **Manual check**: Connect to MongoDB and inspect user documents manually

## After Migration

Once migration is complete:

1. All existing users will have the new fields with default values
2. New user registrations will automatically include all fields
3. The Settings page will work correctly with real database data
4. Usage tracking and plan limits will be functional