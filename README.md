# PNGTuberMaker

The #1 AI PNGTuber Maker for Streamers 🎮

Create custom PNGTuber avatars with AI — complete with multiple expressions and simple animations. Perfect for Twitch, YouTube, and Discord streaming.

## ✨ Features

- **AI-Powered Avatar Generation** - Create unique PNGTuber characters with artificial intelligence
- **Multiple Expressions** - Generate various facial expressions for dynamic streaming
- **Simple Animations** - Add life to your avatar with smooth animations
- **Streaming Ready** - Optimized for Twitch, YouTube, and Discord
- **Easy to Use** - Intuitive interface for streamers of all levels
- **Credit-Based System** - Fair pricing with transparent credit costs
- **Subscription Plans** - Free and PRO plans with different credit allocations

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pngtubermaker-nextjs
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

## 💳 Credit System

Our fair and transparent credit-based system:

- **Free Plan**: 60 credits (one-time)
- **PRO Plan**: 260 credits/month (60 base + 200 PRO)
- **Operation Costs**:
  - Avatar Generation: 5 credits
  - Expression Creation: 3 credits
  - Animation: 2 credits
  - HD Export: 1 credit

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
```

## 📁 Project Structure

```
app/
├── api/                    # API endpoints
│   ├── auth/[...nextauth]/ # NextAuth authentication
│   ├── user/settings/      # User profile management
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
Business Data: UserProfile (credits, plan, preferences)

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
- **Email**: support@pngtubermaker.com
- **Documentation**: Check the project docs folder
- **Issues**: Use GitHub Issues for bug reports

## 📄 License

This project is private and proprietary.

---

Built for content creators who want professional PNGTuber avatars without the complexity.

**Status**: 🟢 **PRODUCTION READY** - All core systems operational
