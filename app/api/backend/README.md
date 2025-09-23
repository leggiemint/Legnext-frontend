# Backend API Endpoints

This directory contains all backend API proxy endpoints that communicate with the external backend system at `BASE_MANAGER_URL`.

## Environment Variables Required

- `BASE_MANAGER_URL`: Backend API base URL (e.g., "https://api.legnext.ai")
- `BACKEND_API_KEY`: Manager API key for administrative operations

## Authentication Types

### 1. Manager API Key (BACKEND_API_KEY)
Used for administrative operations:
- Account creation/management
- Plan updates
- Wallet operations
- Credit pack creation

Header: `API-KEY: {BACKEND_API_KEY}`

### 2. User API Key (X-API-KEY)
Used for user-specific operations:
- Current account info
- Redeem codes
- Business operations (diffusion, upscale)

Header: `X-API-KEY: {user_api_key}`

## Endpoint Structure

### Account Management (Manager Auth)
- `POST /api/backend/account` - Create account
- `GET /api/backend/account/[id]` - Get account by ID
- `PATCH /api/backend/account/[id]/plan` - Update account plan
- `GET/POST /api/backend/account/[id]/api_keys` - Manage API keys
- `PATCH /api/backend/account/[id]/api_keys/[keyId]/revoke` - Revoke API key
- `GET /api/backend/account/[id]/wallet` - Get wallet info
- `POST /api/backend/account/[id]/wallet/credit_pack` - Create credit pack
- `GET /api/backend/account/[id]/wallet/credit_packs` - Get credit packs
- `GET /api/backend/account/[id]/task_histories` - Get task histories
- `GET /api/backend/account/[id]/notifications` - Get notifications
- `PATCH /api/backend/account/[id]/notification/[notificationId]/confirm` - Confirm notification

### User Operations (User Auth)
- `GET /api/backend/account/current` - Get current account info
- `POST /api/backend/account/code/retrieve` - Redeem code

### Business API (User Auth)
- `POST /api/backend/v1/diffusion` - Create diffusion task
- `POST /api/backend/v1/upscale` - Create upscale task
- `GET /api/backend/v1/job/[jobId]` - Get job status

### Webhooks
- `POST /api/backend/callback` - Receive task completion callbacks

## Plan Mapping

Frontend → Backend:
- `free` → `hobbyist`
- `pro` → `developer`

## Credit Pack Expiration

- **Topup/Reset**: 6 months (default if no `expired_at` specified)
- **Subscription/Gift**: 31 days
- **Welcome Pack**: 31 days (200 credits for new users)

## New User Registration Flow

When a new user registers and logs in:

1. **Backend Account Creation**: Creates account with `hobbyist` plan
2. **Frontend Profile Creation**: Stores user info and backend account ID
3. **Welcome Credit Pack**: Automatically creates 200 credits pack with 31-day expiration
4. **API Key Generation**: Backend generates initial API key for user
5. **Init API Key Retrieval**: Fetches the generated API key and stores it in frontend database

## API Key Usage

### For Midjourney/Diffusion Operations
- **Source**: Use stored `initApiKey` from user profile
- **Endpoint**: `/api/user/profile` returns `profile.initApiKey`
- **Advantage**: Faster, no need to fetch from backend API

### For API Key Management
- **Source**: Fetch from backend system via `/api/backend/api-keys`
- **Purpose**: Display, create, revoke API keys
- **Features**: Full CRUD operations for API key management

### For Task Logs
- **Source**: Use Manager API Key (BACKEND_API_KEY)
- **Endpoint**: `/api/backend/account/[id]/task_histories` uses Manager API Key
- **Purpose**: Administrative view of user's task history
- **Note**: This is a management function, not a user operation

### For Subscription Management
- **Source**: Use UserContext for plan and balance information
- **Data**: Plan status, balance, user info from context
- **Purpose**: Display subscription status and manage billing
- **Advantage**: Consistent with other pages using context

### For Credit Balance Management
- **Source**: Independent backend API calls for detailed data
- **Endpoints**: 
  - `/api/backend/account/[id]/wallet` - Get wallet info
  - `/api/backend/account/[id]/wallet/credit_packs` - Get credit packs
- **Purpose**: Display detailed wallet and credit pack information
- **Advantage**: Real-time data, detailed credit pack breakdown

### For Invoice Management
- **Source**: Direct Stripe API integration
- **Endpoint**: `/api/stripe/invoices` - Get user invoices from Stripe
- **Purpose**: Display billing history and invoice management
- **Advantage**: Real-time Stripe data, no user plan restrictions
- **Note**: All users can view their invoice history, even after subscription cancellation

### For Subscription Cancellation
- **Source**: Manual cancellation API with automatic backend sync
- **Endpoint**: `POST /api/stripe/subscription/cancel` - Cancel user subscription
- **Purpose**: Handle subscription cancellation with proper plan updates
- **Features**:
  - **Automatic subscription discovery**: Finds active subscription if not provided
  - **Immediate cancellation**: Updates user plan and backend immediately
  - **End-of-period cancellation**: Schedules cancellation for billing period end
  - **Backend synchronization**: Updates backend plan to 'hobbyist' for immediate cancellations
- **Request Body**:
  ```json
  {
    "subscriptionId": "sub_xxx", // Optional - will auto-discover if not provided
    "immediate": false // true for immediate cancellation, false for end-of-period
  }
  ```

### Subscription Flow

#### Pro Subscription Activation
1. **User initiates checkout** → Stripe Checkout Session
   - Price ID validation with detailed logging
   - User authentication and profile retrieval
   - Stripe customer creation/retrieval
2. **Payment completed** → `checkout.session.completed` webhook
   - Detailed logging for debugging
   - User plan update to 'pro'
3. **Sync to backend**:
   - `PATCH /api/backend/account/[id]/plan` → Update to 'developer' plan
   - `POST /api/backend/account/[id]/wallet/credit_pack` → Add 30000 credits pack (31 days)

#### Subscription Renewal
1. **Monthly payment** → `invoice.payment_succeeded` webhook
2. **Maintain pro status** → `updateUserPlan(userId, 'pro')`
3. **Add renewal credits**:
   - `POST /api/backend/account/[id]/wallet/credit_pack` → Add 30000 credits pack (31 days)

#### Subscription Cancellation
1. **User cancels** → Manual cancellation via `/api/stripe/subscription/cancel`
   - **Immediate cancellation**: Updates user plan and backend immediately
   - **End of period cancellation**: Plan changes handled by webhook when subscription actually ends
2. **Webhook handling** → `customer.subscription.deleted` webhook
   - **Downgrade user** → `updateUserPlan(userId, 'free')`
   - **Sync to backend** → `PATCH /api/backend/account/[id]/plan` → Update to 'hobbyist' plan

### Welcome Credit Pack Details

- **Amount**: 200 credits
- **Validity**: 31 days from registration

### Pro Subscription Credit Pack Details

- **Amount**: 30000 credits
- **Validity**: 31 days from subscription/renewal
- **Description**: 'Pro subscription credit pack' / 'Pro subscription renewal credit pack'
- **Type**: Subscription (31-day expiration)

### Debugging and Monitoring

#### Checkout Session Debug Logs
- `🛒 Creating checkout session...` - Session creation started
- `📋 Request body:` - Request parameters received
- `🔧 STRIPE_CONFIG.prices:` - Available price IDs
- `✅ Supported prices:` - Validated price IDs
- `👤 Getting user info for:` - User lookup
- `✅ User found:` - User details retrieved
- `💳 Creating/getting Stripe customer...` - Stripe customer process
- `✅ Stripe customer ID:` - Customer ID obtained
- `💾 Updating Stripe customer ID in database...` - Database update
- `🛒 Creating checkout session with params:` - Session parameters
- `✅ Checkout session created:` - Session details

#### Webhook Debug Logs
- `Processing webhook event: ${event.type}` - Event type received
- `Syncing subscription to backend for account ${accountId}` - Backend sync started
- `Plan updated:` - Backend plan update response
- `✅ Backend account updated to developer plan with 30000 credits pack` - Success confirmation
- `❌ Failed to sync with backend system:` - Error details with stack trace

#### Price ID Configuration
- **Environment Variable**: `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- **Fallback**: `price_1S5uw4KyeXh3bz3dRuK7bAcv`
- **Validation**: Both config and STRIPE_CONFIG must match
- **Debug**: Check console logs for price ID validation errors

#### Common Stripe Errors and Solutions

**Error**: `StripeInvalidRequestError: You can only enable invoice creation when mode is set to payment`
- **Cause**: Trying to enable `invoice_creation` in subscription mode
- **Solution**: Remove `invoice_creation` config for subscription mode (Stripe auto-creates invoices)
- **Status**: ✅ Fixed

**Error**: `Invalid price ID`
- **Cause**: Price ID mismatch between config and STRIPE_CONFIG
- **Solution**: Ensure both use same price ID with fallback values
- **Status**: ✅ Fixed

**Error**: `Failed to create checkout session`
- **Debug**: Check server logs for detailed error information
- **Common causes**: Invalid price ID, Stripe API key issues, customer creation failures