# Stripe 订阅支付调试指南

## 🎯 问题描述
Stripe订阅支付完成后，没有正确更新plan和充值对应的credits到后端系统。

## 🔧 已添加的调试工具

### 1. 增强的调试日志
所有关键步骤现在都有详细的调试日志：
- `[DEBUG]` - 一般调试信息
- `[WEBHOOK]` - Webhook处理信息  
- `[BACKEND-SYNC]` - 后端同步过程
- `[BACKEND-API]` - 后端API调用
- `[BACKEND-CONFIG]` - 后端配置检查

### 2. 用户状态检查API
```bash
GET /api/debug/user-status
```
返回用户的完整状态信息，包括：
- 用户基本信息和订阅状态
- 后端账户信息和余额
- 最近的交易记录
- 最近的webhook事件
- 后端配置验证状态

### 3. 手动触发订阅处理API
```bash
POST /api/debug/trigger-subscription
{
  "plan": "pro",
  "credits": 200, 
  "backendCredits": 33000,
  "skipFrontend": false,
  "skipBackend": false
}
```

### 4. 调试页面
访问 `http://localhost:3001/debug` 在浏览器中使用调试工具

### 5. Webhook测试脚本
```bash
node test-webhook.js           # 测试订阅激活
node test-cancel-webhook.js    # 测试订阅取消
```

## 📊 调试步骤

### 第一步：检查用户当前状态
```bash
# 1. 启动开发服务器
npm run dev

# 2. 登录系统后访问调试页面
http://localhost:3001/debug

# 3. 点击"检查用户状态"按钮
# 或直接API调用
curl -X GET "http://localhost:3001/api/debug/user-status" -H "Cookie: next-auth.session-token=用户session"
```

### 第二步：模拟Stripe支付流程
```bash
# 1. 编辑 test-webhook.js 中的用户信息：
# - client_reference_id: 替换为实际用户ID  
# - customer_details.email: 替换为实际用户邮箱

# 2. 运行测试脚本
node test-webhook.js

# 3. 观察服务器控制台的详细调试日志
```

### 第三步：手动触发处理
```bash
# 订阅激活测试
curl -X POST "http://localhost:3001/api/debug/trigger-subscription" \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro", "credits": 200, "backendCredits": 33000}'

# 订阅取消测试
curl -X POST "http://localhost:3001/api/debug/trigger-cancellation" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing cancellation flow"}'
```

## 🔍 关键检查点

### 1. Webhook接收
检查日志中是否有：
```
🔔 [WEBHOOK] Stripe webhook received!
📊 [WEBHOOK] Webhook details: {...}
✅ Webhook verified successfully: {...}
```

### 2. 用户识别
检查是否能正确找到用户：
```
👤 [WEBHOOK] User identification: {...}
🚀 Starting subscription activation for user: xxx
```

### 3. 订阅更新
检查前端订阅状态更新：
```
🔄 [DEBUG] Updating subscription for user xxx to pro plan...
📊 Subscription update result: { success: true, ... }
```

### 4. Credits授予
检查前端credits授予：
```
💰 [DEBUG] Granting 200 credits to user xxx...
📊 Credit grant result: { success: true, newBalance: xxx }
```

### 5. 后端配置检查
```
🔧 [BACKEND-CONFIG] Configuration check: { isValid: true }
```

### 6. 后端账户ID
检查是否找到后端账户ID：
```
🔍 Checking backend account ID in user preferences...
📊 Backend account ID: { found: true, accountId: xxx }
```

### 7. 后端同步
检查后端plan更新和credits pack创建：
```
🔄 [BACKEND-STEP-1] Updating backend plan to developer...
📊 Backend plan update result: { success: true, ... }

🔄 [BACKEND-STEP-2] Creating 33000 credits pack...
📊 Backend credit pack result: { success: true, ... }
```

### 8. 取消订阅处理
检查取消订阅的处理：
```
🚫 [WEBHOOK] Processing subscription cancellation: {...}
🔄 [WEBHOOK] Canceling subscription for user: xxx
✅ [WEBHOOK] Frontend subscription canceled for user: xxx
🔄 [BACKEND-CANCEL] Syncing cancellation to backend account: xxx
✅ [BACKEND-CANCEL] Backend plan downgraded to hobbyist
```

## ❌ 常见问题及解决方案

### 问题1：没有后端账户ID
**症状**: `No backend account ID found`
**解决**: 
1. 先创建后端账户：`POST /api/backend/account`
2. 或检查用户preferences中的backendAccountId

### 问题2：后端配置无效
**症状**: `Backend configuration invalid`
**解决**: 检查环境变量 `BASE_MANAGER_URL` 和 `BACKEND_API_KEY`

### 问题3：后端API调用失败
**症状**: Backend API调用返回错误状态码
**解决**: 
1. 检查后端API服务是否运行
2. 检查API密钥是否正确
3. 检查网络连接

### 问题4：Webhook签名验证失败
**症状**: `Webhook signature verification failed`
**解决**: 检查 `STRIPE_WEBHOOK_SECRET` 环境变量

## 🎯 预期的成功流程

完整的成功流程应该产生以下日志：
1. Webhook接收和验证 ✅
2. 用户识别成功 ✅  
3. 订阅状态更新为pro ✅
4. 前端授予200 credits ✅
5. 后端配置验证通过 ✅
6. 找到后端账户ID ✅
7. 后端计划更新为developer ✅
8. 后端创建33000 credits pack ✅
9. 同步成功完成 ✅

使用这些调试工具，你应该能够准确找到Stripe订阅支付处理中的问题所在！