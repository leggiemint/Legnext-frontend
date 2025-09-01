# Legnext

The #1 way to access Midjourney via API

Integrate Midjourney into your apps — no Midjourney account required. Reliable, fast, and developer-friendly.

## ✨ Features

- **No Midjourney Account Required** - Direct API access without personal Midjourney subscription
- **Simple REST API Integration** - Easy-to-use endpoints for developers
- **Production-Ready & Scalable** - Enterprise-grade stability and performance
- **All Midjourney Models Available** - Support for v5, v6, niji, and all latest models
- **Multiple Generation Modes** - Fast, Mixed, and Turbo generation options
- **Advanced Features** - Image upscaling, variations, style references (--sref), character references (--cref)
- **Developer-Friendly** - Comprehensive documentation and SDKs

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd legnext-midjourney-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your configuration values
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + DaisyUI
- **Database**: PostgreSQL with Prisma
- **Authentication**: NextAuth.js with Google OAuth
- **Payments**: Stripe (primary) / Square (alternative)
- **Deployment**: Vercel Ready
- **Language**: TypeScript

## 💳 API Usage System

Our transparent API usage system:

- **Free Tier**: 100 API calls (one-time)
- **PRO Plan**: 5,000 API calls/month
- **Operation Costs**:
  - Image Generation: 1-3 credits (varies by model)
  - Image Upscaling: 2 credits
  - Variations: 1-2 credits
  - Fast Mode: 2x credit cost
  - Turbo Mode: 3x credit cost

## 🔧 Environment Variables

### Required Variables
```bash
# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# Database (Prisma)
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"

# Payment Gateway (choose one)
PAYMENT_GATEWAY=stripe  # or square

# Stripe (if using Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...

# Square (if using Square)
SQUARE_ACCESS_TOKEN=your_production_token
SQUARE_APPLICATION_ID=your_app_id
SQUARE_LOCATION_ID=your_location_id
SQUARE_WEBHOOK_SECRET=your_webhook_secret
SQUARE_ENVIRONMENT=production

# Cloudflare R2 Storage
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.your-subdomain.r2.cloudflarestorage.com

# Midjourney API Configuration
MIDJOURNEY_API_KEY=your-midjourney-api-key
MIDJOURNEY_SERVER_ID=your-discord-server-id
MIDJOURNEY_CHANNEL_ID=your-discord-channel-id
```

## 📁 Project Structure

```
app/
├── api/                    # API endpoints
│   ├── auth/[...nextauth]/ # NextAuth authentication
│   ├── user/settings/      # User profile management
│   ├── midjourney/         # Midjourney API integration
│   ├── generate/           # Image generation endpoints
│   ├── stripe/             # Stripe payment endpoints
│   ├── webhook/stripe/     # Stripe webhook handler
│   └── migrate/            # Data migration utilities
├── app/                    # Main application pages
└── components/             # React components

libs/
├── prisma.ts               # Prisma client configuration
├── next-auth.ts            # NextAuth configuration
├── payment.ts              # Payment gateway abstraction
├── stripe.ts               # Stripe implementation
└── square.ts               # Square implementation

models/
├── User.ts                 # NextAuth user data
├── UserProfile.ts          # Business user data
├── Payment.ts              # Payment records
├── Subscription.ts         # Subscription details
└── Usage.ts                # Operation tracking
```

## 🔌 API Endpoints

### Core APIs
- `POST /api/auth/[...nextauth]` - Authentication endpoints
- `GET/PUT /api/user/settings` - User profile management
- `POST /api/midjourney/generate` - Generate images via Midjourney
- `POST /api/midjourney/upscale` - Upscale generated images
- `POST /api/midjourney/variations` - Create image variations
- `POST /api/stripe/create-checkout` - Create payment session
- `POST /api/stripe/create-portal` - Customer portal access

### Webhooks
- `POST /api/webhook/stripe` - Stripe event processing

### Migration (if needed)
- `GET/POST /api/migrate/user-credits` - User data migration

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set all required environment variables
3. Deploy automatically on push to main branch

### Database Setup
1. Set up PostgreSQL database (Vercel Postgres, Neon, or your own)
2. Configure DATABASE_URL and DIRECT_URL in environment variables
3. Run Prisma migrations: `npx prisma migrate deploy`

### Payment Gateway Setup
1. Choose between Stripe or Square
2. Set `PAYMENT_GATEWAY` environment variable
3. Configure gateway-specific credentials

## 🔄 Data Migration

If you're upgrading from an older version, you may need to run the credit migration:

```bash
# Check migration status
GET /api/migrate/user-credits

# Run migration if needed
POST /api/migrate/user-credits
```

## 📊 System Architecture

```
Authentication Flow:
Google OAuth → NextAuth → PostgreSQL (users table)
                      ↓
Business Data: UserProfile (API calls, plan, preferences)

Payment Flow:
Stripe/Square → Webhook → Update User + UserProfile
                         ↓
Frontend API → Read from UserProfile
```

## 🎯 Development

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Code linting
npm run db:generate  # Generate Prisma client
npm run db:push      # Push database schema
npm run db:studio    # Open Prisma Studio
```

### Database Operations (Prisma)
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:deploy    # Deploy migrations
npm run db:studio    # Open Prisma Studio
```

## 🚨 Production Checklist

- [ ] All environment variables configured
- [ ] PostgreSQL database connection tested
- [ ] Prisma migrations deployed: `npx prisma migrate deploy`
- [ ] Payment gateway configured and tested
- [ ] Webhook endpoints secured
- [ ] Credit migration completed (if needed)
- [ ] Authentication flow working
- [ ] Subscription system operational

## 📝 Support

For questions and support:
- **Email**: support@legnext.ai
- **Documentation**: Check the project docs folder
- **Issues**: Use GitHub Issues for bug reports

## 📄 License

This project is private and proprietary.

---

Built for developers who want reliable Midjourney API access without the complexity.

**Status**: 🟢 **PRODUCTION READY** - All core systems operational
