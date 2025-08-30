# Stripe Environment Configuration

This project supports both development/testing and production Stripe environments with intelligent plan matching.

## How It Works

### 1. Config-based Plan Matching
The system first tries to match the incoming `priceId` with plans defined in `config.ts`:

```typescript
// config.ts
{
  priceId: process.env.STRIPE_PRO_PRICE_ID || "price_1S1qwI3W9QrG6TfeSztwI9lT", // 优先使用环境变量
}
```

### 2. Smart Fallback Logic
If no exact match is found, the webhook applies intelligent fallback logic:

- **Test Price IDs**: Any `priceId` that starts with `price_` and doesn't contain `prod` is treated as a test subscription
- **Development Mode**: When `NODE_ENV !== 'production'`, assumes paid subscriptions are Pro plans
- **Subscription Mode**: Only applies fallback for subscription payments, not one-time payments

## Environment Setup

### Development/Testing
```bash
# .env.local
NODE_ENV=development
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Specify your test Pro price ID
STRIPE_PRO_PRICE_ID=price_1TestProPlan123
```

### Production
```bash
# .env.production
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Production price ID is automatically used from config.ts
```

## Webhook Behavior

### Development Mode
- ✅ Exact price match → Uses config plan
- ✅ No match + subscription → Auto-assumes Pro plan
- ✅ Detailed logging for debugging

### Production Mode
- ✅ Exact price match → Uses config plan
- ❌ No match → Rejects (prevents accidental upgrades)
- ✅ Reduced logging for performance

## Benefits

1. **Seamless Development**: Test with any Stripe test price ID without config changes
2. **Production Safety**: Only exact matches work in production
3. **Flexible Testing**: Set `STRIPE_PRO_PRICE_ID` for specific test scenarios
4. **Automatic Detection**: No manual environment switching needed

## Debugging

Check webhook logs for plan matching details:
```bash
# Development logs will show:
"No exact plan match for priceId: price_test_123, applying fallback logic"
"Detected test environment, assuming Pro plan"
```

## Migration Guide

### From Hardcoded Price IDs
1. Update `config.ts` to use environment-based price IDs
2. Set `STRIPE_PRO_PRICE_ID` in development if needed
3. Deploy - production will use the hardcoded production price ID

### Testing New Price IDs
1. Create test price in Stripe Dashboard
2. Set `STRIPE_PRO_PRICE_ID=your_test_price_id`
3. Test subscription flow
4. Update production price ID in `config.ts` when ready