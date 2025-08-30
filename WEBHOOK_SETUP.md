# Local Webhook Development Setup

## 问题诊断

如果支付后用户状态没有更新，且没有看到webhook日志，原因可能是：

1. **Stripe CLI未配置** - 本地开发需要Stripe CLI转发webhook
2. **Webhook URL不正确** - Stripe仪表板中的webhook URL设置错误
3. **签名验证失败** - webhook secret不匹配

## 解决方案

### 选项1: 使用Stripe CLI (推荐)

1. **安装Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   # 下载从 https://github.com/stripe/stripe-cli/releases
   
   # Linux
   wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_*_linux_x86_64.tar.gz
   ```

2. **登录Stripe**
   ```bash
   stripe login
   ```

3. **转发webhook到本地**
   ```bash
   # 启动webhook转发 (在项目根目录运行)
   stripe listen --forward-to localhost:3000/api/webhook/stripe
   
   # 你会看到类似输出:
   # Ready! Your webhook signing secret is whsec_1234... (^C to quit)
   ```

4. **更新环境变量**
   ```bash
   # 将上面的signing secret添加到 .env.local
   STRIPE_WEBHOOK_SECRET=whsec_1234...
   ```

5. **测试支付流程**
   - 重启Next.js开发服务器
   - 进行测试支付
   - 查看终端日志确认webhook被接收

### 选项2: 临时跳过签名验证

如果暂时无法设置Stripe CLI，可以临时跳过签名验证：

1. **清空webhook secret**
   ```bash
   # .env.local
   STRIPE_WEBHOOK_SECRET=
   # 或者直接删除这行
   ```

2. **重启开发服务器**
   ```bash
   npm run dev
   ```

现在webhook将在开发模式下跳过签名验证。

## 调试工具

### 1. 测试webhook连接
```bash
node scripts/test-webhook.js
```

### 2. 访问测试端点
- GET: http://localhost:3000/api/webhook/stripe/test
- POST: http://localhost:3000/api/webhook/stripe/test

### 3. 检查日志
支付完成后，在终端中应该看到类似日志：
```
=== STRIPE WEBHOOK RECEIVED === 2024-01-01T12:00:00.000Z
Received Stripe webhook event: checkout.session.completed
Webhook checkout.session.completed: {
  customerId: 'cus_...',
  priceId: 'price_...',
  userId: '...',
  planFound: true,
  planName: 'Pro'
}
```

## 验证设置

### Stripe仪表板检查
1. 进入 [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. 确认webhook端点设置正确
3. 检查最近的webhook传送记录

### 本地验证
1. 确认Next.js在3000端口运行
2. 确认webhook路由存在：`app/api/webhook/stripe/route.ts`
3. 确认环境变量正确设置

## 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 无webhook日志 | Stripe CLI未转发 | 运行 `stripe listen` |
| 签名验证失败 | Secret不匹配 | 更新STRIPE_WEBHOOK_SECRET |
| 404错误 | URL路径错误 | 检查webhook URL设置 |
| JSON解析错误 | 请求格式错误 | 检查Content-Type头 |

## 生产部署

生产环境中：
1. 在Stripe仪表板添加webhook端点：`https://yourdomain.com/api/webhook/stripe`
2. 设置正确的STRIPE_WEBHOOK_SECRET
3. 确保NODE_ENV=production