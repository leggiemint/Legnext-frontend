# Vercel部署环境变量配置指南

## 🚀 部署前准备

### 1. 数据库设置
推荐使用以下PostgreSQL服务之一：
- **Vercel Postgres** (推荐) - 与Vercel完美集成
- **Neon** - 高性能PostgreSQL服务
- **Supabase** - 开源PostgreSQL服务
- **自建PostgreSQL服务器**

### 2. 支付网关选择
- **Stripe** (推荐) - 全球支付解决方案
- **Square** - 美国地区支付服务

## 🔧 必需环境变量

### 基础配置
```bash
# 应用配置
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key-here

# 数据库配置 (Prisma)
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"
```

### 认证配置
```bash
# Google OAuth
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret
```

### 支付网关配置
```bash
# 支付网关选择
PAYMENT_GATEWAY=stripe  # 或 square

# Stripe配置 (如果使用Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_1S1k2eKyeXh3bz3dL2jbl2VM

# Square配置 (如果使用Square)
SQUARE_ACCESS_TOKEN=your_production_token
SQUARE_APPLICATION_ID=your_app_id
SQUARE_LOCATION_ID=your_location_id
SQUARE_WEBHOOK_SECRET=your_webhook_secret
SQUARE_ENVIRONMENT=production
```

### 邮件配置
```bash
# Mailgun配置
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.pngtubermaker.com

# Cloudflare R2存储配置
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.your-subdomain.r2.cloudflarestorage.com
```

## 📋 Vercel部署步骤

### 1. 连接GitHub仓库
1. 登录 [Vercel](https://vercel.com)
2. 点击 "New Project"
3. 导入你的GitHub仓库
4. 选择项目根目录

### 2. 配置环境变量
1. 在项目设置中找到 "Environment Variables"
2. 添加所有必需的环境变量
3. 确保选择正确的环境 (Production, Preview, Development)

### 3. 数据库连接
1. 在Vercel项目设置中找到 "Storage"
2. 创建新的PostgreSQL数据库
3. 复制连接字符串到环境变量

### 4. 部署配置
```bash
# 构建命令
npm run build

# 输出目录
.next

# 安装命令
npm install
```

## 🗄️ 数据库迁移

部署完成后，需要运行Prisma迁移：

```bash
# 方法1: 通过Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# 方法2: 通过Vercel函数
# 创建一个API端点来运行迁移
```

## 🔍 部署后检查

### 1. 数据库连接测试
- 检查Prisma连接是否正常
- 验证表结构是否正确创建

### 2. 认证流程测试
- 测试Google OAuth登录
- 验证用户数据保存

### 3. 支付系统测试
- 测试订阅创建
- 验证webhook处理

### 4. 环境变量验证
```bash
# 在Vercel函数中检查
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('PAYMENT_GATEWAY:', process.env.PAYMENT_GATEWAY);
```

## 🚨 常见问题

### 1. 数据库连接失败
- 检查 `DATABASE_URL` 格式
- 确认数据库防火墙设置
- 验证数据库用户权限

### 2. 认证失败
- 检查 `NEXTAUTH_URL` 是否正确
- 验证Google OAuth配置
- 确认域名在Google OAuth白名单中

### 3. 支付系统问题
- 检查支付网关环境变量
- 验证webhook端点配置
- 确认价格ID是否正确

## 📚 相关资源

- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js 部署](https://next-auth.js.org/configuration/providers/google)
- [Stripe 部署指南](https://stripe.com/docs/keys)

---

**注意**: 生产环境部署前，请确保所有敏感信息都已正确配置，并且数据库已备份。
