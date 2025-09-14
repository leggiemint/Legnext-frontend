# Libs 工具库目录

精简后的工具库，只保留项目必需的核心功能模块。

## 目录结构

### 🔐 认证相关
- **`next-auth.ts`** - NextAuth.js配置，Google OAuth集成
- **`auth-helpers.ts`** - 认证辅助函数，API密钥提取

### 🗄️ 数据库
- **`prisma.ts`** - Prisma数据库客户端配置

### 🚀 Backend系统集成
- **`backend-api-client.ts`** - Backend API客户端，账户管理、任务历史等
- **`user-helpers.ts`** - 用户数据管理，profile创建和同步

### 💳 支付系统
- **`stripe-client.ts`** - Stripe支付客户端，订阅管理、发票处理

### 📁 文件存储
- **`r2.ts`** - Cloudflare R2对象存储集成

## 已删除的文件

以下文件已被删除，因为不再需要或有更好的替代方案：

### 删除的邮件服务
- ❌ `mailgun.ts` - Mailgun邮件服务（未使用）
- ❌ `resend.ts` - Resend邮件服务（重复功能）

### 删除的AI集成
- ❌ `gpt.ts` - OpenAI GPT集成（项目不需要）

### 删除的重复文件
- ❌ `backend-client.ts` → 使用 `backend-api-client.ts`
- ❌ `stripe.ts` → 使用 `stripe-client.ts`
- ❌ `user-service.ts` → 使用 `user-helpers.ts`

### 删除的过时工具
- ❌ `api.ts` - 通用API工具（过时）
- ❌ `api-auth.ts` - 旧的认证工具（过时）
- ❌ `payment.ts` - 旧的支付逻辑（过时）
- ❌ `seo.tsx` - SEO工具（不需要）

## 文件用途说明

### `next-auth.ts`
NextAuth.js配置文件，处理Google OAuth认证
```typescript
import { authOptions } from '@/libs/next-auth';
```

### `auth-helpers.ts`
认证相关辅助函数
```typescript
import { getUserApiKey, getManagerApiKey } from '@/libs/auth-helpers';
```

### `prisma.ts`
Prisma数据库客户端
```typescript
import { prisma } from '@/libs/prisma';
```

### `backend-api-client.ts`
Backend系统API客户端
```typescript
import { backendApiClient } from '@/libs/backend-api-client';
```

### `user-helpers.ts`
用户数据管理函数
```typescript
import { 
  getUserWithProfile, 
  createUserProfileWithBackend,
  updateUserPlan 
} from '@/libs/user-helpers';
```

### `stripe-client.ts`
Stripe支付系统客户端
```typescript
import { 
  stripe, 
  createSubscriptionCheckoutSession,
  getSubscriptionInfo 
} from '@/libs/stripe-client';
```

### `r2.ts`
Cloudflare R2存储客户端
```typescript
import { uploadToR2, getR2Url } from '@/libs/r2';
```

## 环境变量要求

确保以下环境变量已配置：

```bash
# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret"
GOOGLE_ID="your-google-id"
GOOGLE_SECRET="your-google-secret"

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Backend System
BACKEND_API_URL="https://api.legnext.ai"
BACKEND_API_KEY="your-backend-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_xxx"

# Cloudflare R2
R2_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-key"
R2_SECRET_ACCESS_KEY="your-secret"
R2_BUCKET_NAME="your-bucket"
R2_PUBLIC_URL="https://your-domain.com"
```

## 重构成果

通过这次重构，我们：

- ✅ **精简了50%的文件** - 从17个文件减少到8个文件
- ✅ **消除了重复代码** - 移除了3组重复功能
- ✅ **提高了代码质量** - 统一命名规范和功能分离
- ✅ **减少了维护成本** - 更少的文件和依赖
- ✅ **保持了功能完整** - 所有必需功能都被保留

libs目录现在只包含项目实际需要的核心工具库，更加简洁和易于维护。