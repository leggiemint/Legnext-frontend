# API Overview - PngTuberMaker

## 🚀 Production API Endpoints

### 🔐 Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication endpoints

### 👤 User Management
- `GET /api/user/settings` - Get user profile, credits, and preferences (UserProfile model)
- `PUT /api/user/settings` - Update user preferences

### 💳 Stripe Integration
- `POST /api/stripe/create-checkout` - Create Stripe checkout session for PRO subscription
- `POST /api/stripe/create-portal` - Create Stripe customer portal for subscription management

### 🔗 Webhooks
- `POST /api/webhook/stripe` - Handle Stripe webhook events (subscriptions, payments)
- `POST /api/webhook/mailgun` - Handle email delivery webhooks

### 📧 Contact & Leads
- `POST /api/contact` - Handle contact form submissions
- `POST /api/lead` - Handle lead generation

### 🔧 Migration (One-time use)
- `GET /api/migrate/user-credits` - Check credit migration status
- `POST /api/migrate/user-credits` - Migrate User model data to UserProfile model

## 📊 Data Models

### Primary Models
- **UserProfile** - Main user business data (credits, plan, preferences)
- **User** - NextAuth user data + backup business data (for compatibility)
- **Payment** - Stripe payment records
- **Subscription** - Stripe subscription details
- **Usage** - User operation tracking

### Data Flow
```
Stripe Webhook → Updates both User & UserProfile models
Frontend APIs → Read from UserProfile model
Migration API → Syncs User → UserProfile
```

## 🧹 Recently Cleaned Up

### ❌ Removed (Production safety)
- `app/api/debug/*` - All debug endpoints removed for security
- `app/api/user/settings-new` - Merged into main settings endpoint
- `app/api/migrate/user-schema` - Replaced by user-credits migration
- `scripts/migrate-user-schema.js` - Obsolete migration script

### ✅ Consolidated
- User settings API now unified at `/api/user/settings`
- Migration focused on credit synchronization
- Clean separation between auth data and business data

## 🔒 Security Notes

- No debug endpoints in production
- All user data access requires authentication
- Webhook endpoints validate Stripe signatures
- Credit operations are atomic and logged

## 📈 Credit System

- **Free Plan**: 60 credits (one-time)
- **PRO Plan**: 260 credits per month (60 base + 200 PRO)
- **Operations**: Avatar (5 credits), Expressions (3 credits), Animation (2 credits), HD Export (1 credit)
- **Storage**: Primary in UserProfile, backup in User model
- **Sync**: Stripe webhooks update both models simultaneously

## 🚀 Deployment Ready

All APIs are now production-ready with:
- ✅ Clean code structure
- ✅ No debug endpoints
- ✅ Unified data models
- ✅ Proper error handling
- ✅ Credit system working correctly
- ✅ Migration tools available if needed
