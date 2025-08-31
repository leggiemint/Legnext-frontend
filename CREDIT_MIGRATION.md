# PRO User Credit Migration Guide

## 🚨 Important: Production Database Migration Required

After implementing the UserProfile credit system fix, you **MUST** run a data migration in production to sync existing user data from the `User` model to the `UserProfile` model.

## 🔍 Problem Being Solved

- **Issue**: PRO users showing only 60 credits instead of 260+ credits
- **Root Cause**: Stripe webhooks were updating `User` model, but frontend reads from `UserProfile` model
- **Solution**: Sync all existing user data from `User` to `UserProfile` model

## 🎯 What Data Gets Migrated

- ✅ User plan (free/pro)
- ✅ Credit balance and history
- ✅ Subscription status and dates
- ✅ User preferences
- ✅ Usage statistics
- ✅ Stripe customer/price IDs

## 🚀 Migration Options

### Option 1: API Route Migration (Recommended)

**Step 1: Check Migration Status**
```bash
# GET request to check if migration is needed
curl https://your-domain.com/api/migrate/user-credits
```

**Step 2: Run Migration**
```bash
# POST request to run the migration
curl -X POST https://your-domain.com/api/migrate/user-credits
```

**Or use browser:**
- Check status: `https://your-domain.com/api/migrate/user-credits`
- Run migration: Send POST to the same URL (use Postman, curl, or API client)

### Option 2: Node.js Script (Alternative)

```bash
# Make sure environment variables are set
node scripts/migrate-user-to-userprofile.js
```

## 📊 Expected Results

**Before Migration:**
- PRO users see 60 credits (wrong)
- UserProfile may not exist for some users
- Data inconsistency between models

**After Migration:**
- PRO users see correct credits (260+ credits)
- All users have synchronized UserProfile records
- Data consistency maintained

## 🔒 Safety Features

- ✅ **Non-destructive**: Only adds/updates data, never deletes
- ✅ **Idempotent**: Can be run multiple times safely
- ✅ **Verification**: Includes data verification checks
- ✅ **Detailed logging**: Shows exactly what was migrated
- ✅ **Error handling**: Continues migration even if some users fail

## 📋 Pre-Migration Checklist

- [ ] **Backup your database** (CRITICAL!)
- [ ] Test migration on staging environment first
- [ ] Verify environment variables are set
- [ ] Ensure database connection is working
- [ ] Notify users of potential brief downtime (optional)

## 🧪 Verification Steps

1. **Check migration status API** for data consistency
2. **Test PRO user accounts** to see correct credit balance
3. **Verify new subscriptions** continue to work
4. **Monitor webhook processing** for any issues

## 📝 Example API Response

**Migration Status (GET):**
```json
{
  "status": "migration_needed",
  "summary": {
    "totalUsers": 150,
    "totalProfiles": 120,
    "proUsers": 25,
    "proProfiles": 20,
    "needsMigration": true,
    "dataMismatches": 5
  },
  "recommendation": "Run POST /api/migrate/user-credits"
}
```

**Migration Results (POST):**
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "stats": {
    "totalUsers": 150,
    "migrated": 30,
    "skipped": 120,
    "errors": 0,
    "proUsersFound": 25,
    "proUsersMigrated": 25
  }
}
```

## ⚠️ Troubleshooting

**If migration fails:**
1. Check database connection and permissions
2. Review error messages in the response
3. Ensure MongoDB has sufficient resources
4. Try running again (it's safe to retry)

**If PRO users still see wrong credits:**
1. Verify migration completed successfully
2. Check browser cache (hard refresh)
3. Verify UserProfile records in database
4. Check webhook processing logs

## 🔄 Post-Migration

**What happens next:**
1. ✅ Frontend reads from UserProfile (already implemented)
2. ✅ Webhooks update both models (already implemented)
3. ✅ New users automatically get UserProfile
4. ✅ PRO users see correct credit balance

**Monitoring:**
- Watch for any webhook processing errors
- Monitor user feedback about credit balances
- Verify new subscriptions work correctly

## 🆘 Emergency Rollback

If issues occur, you can:
1. Temporarily switch frontend to read from User model
2. Restore database from backup
3. Contact support with migration logs

## ✅ Success Criteria

Migration is successful when:
- [ ] All PRO users see correct credit balance (260+ credits)
- [ ] New subscriptions continue to work
- [ ] No webhook processing errors
- [ ] User experience is seamless

---

**🚨 Remember: Always backup your production database before running any migration!**
