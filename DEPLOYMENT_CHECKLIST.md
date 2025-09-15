# 部署检查清单

## 环境变量检查

确保以下环境变量已正确设置：

### 必需的环境变量
```bash
# NextAuth 配置
NEXTAUTH_URL="https://legnext.ai"  # 生产环境URL
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_ID="your-google-client-id"
GOOGLE_SECRET="your-google-client-secret"

# 数据库
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# 后端API
BACKEND_API_URL="https://api.legnext.ai"  # 或者使用 BASE_MANAGER_URL
BACKEND_API_KEY="your-backend-api-key"

# Stripe支付
STRIPE_SECRET_KEY="sk_live_xxx"  # 生产环境使用live key
STRIPE_WEBHOOK_SECRET="whsec_xxx"
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_xxx"

# Cloudflare R2
R2_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-key"
R2_SECRET_ACCESS_KEY="your-secret"
R2_BUCKET_NAME="your-bucket"
R2_PUBLIC_URL="https://cdn.legnext.ai"

# 应用配置
NEXT_PUBLIC_APP_URL="https://legnext.ai"
```

## 部署前检查

### 1. 环境变量验证
访问 `/api/health` 端点检查环境变量配置：
```bash
curl https://legnext.ai/api/health
```

### 2. 数据库连接测试
确保数据库连接正常，运行：
```bash
npx prisma db push
```

### 3. 后端API连接测试
确保后端API可访问：
```bash
curl -H "API-KEY: your-backend-api-key" https://api.legnext.ai/api/account/info
```

## 部署步骤

### 1. 构建应用
```bash
npm run build
```

### 2. 启动服务
```bash
# 使用PM2
pm2 start ecosystem.config.js

# 或者使用Docker
docker-compose up -d
```

### 3. 配置Nginx
确保nginx配置正确，特别是SSE支持：
- 检查 `proxy_buffering off` 设置
- 检查 `proxy_cache off` 设置
- 检查CORS头设置

### 4. SSL证书
确保SSL证书有效且配置正确

## 常见问题排查

### 网络连接错误
1. 检查环境变量 `BACKEND_API_KEY` 是否正确设置
2. 检查后端API是否可访问
3. 检查防火墙设置

### SSE连接错误
1. 检查nginx配置中的SSE设置
2. 检查CORS头配置
3. 检查浏览器控制台错误信息

### 用户认证错误
1. 检查 `NEXTAUTH_URL` 是否设置为正确的生产URL
2. 检查Google OAuth配置
3. 检查数据库连接

## 监控和日志

### 健康检查
定期检查 `/api/health` 端点状态

### 日志位置
- 应用日志：`./logs/`
- Nginx日志：`/var/log/nginx/`
- PM2日志：`pm2 logs`

### 关键指标
- API响应时间
- SSE连接稳定性
- 数据库连接状态
- 后端API可用性

## 回滚计划

如果部署出现问题：
1. 停止当前服务：`pm2 stop all`
2. 恢复到上一个版本
3. 检查环境变量配置
4. 重新部署

## 联系支持

如果遇到问题，请联系：
- 技术支持：support@legnext.ai
- 查看日志获取详细错误信息
