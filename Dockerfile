# Use the official Node.js 18 image with Alpine 3.17 for Prisma compatibility
FROM node:18-alpine3.17 AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install pnpm (指定版本确保兼容性)
RUN npm install -g pnpm@8.15.1

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# 声明构建时必需的环境变量，但不持久化到镜像
ARG DATABASE_URL
ARG DIRECT_URL
ARG BACKEND_API_KEY
ARG STRIPE_SECRET_KEY
ARG RESEND_API_KEY
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL

# 临时设置环境变量，仅用于构建过程
# 这些变量不会出现在最终的运行时镜像中

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install pnpm (指定版本确保兼容性)
RUN npm install -g pnpm@8.15.1

# Generate Prisma client (使用构建时参数)
RUN DATABASE_URL="$DATABASE_URL" DIRECT_URL="$DIRECT_URL" pnpm prisma generate

# Build the application (使用构建时参数，不持久化到镜像)
RUN DATABASE_URL="$DATABASE_URL" \
    DIRECT_URL="$DIRECT_URL" \
    BACKEND_API_KEY="$BACKEND_API_KEY" \
    STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
    RESEND_API_KEY="$RESEND_API_KEY" \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    NEXTAUTH_URL="$NEXTAUTH_URL" \
    SKIP_BUILD_STATIC_GENERATION=true \
    pnpm run build

# Verify Prisma client generation
RUN ls -la node_modules/.prisma/ || echo "Prisma client not found in expected location"

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# 安装运行时需要的依赖
RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install pnpm (指定版本确保兼容性)
RUN npm install -g pnpm@8.15.1

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]