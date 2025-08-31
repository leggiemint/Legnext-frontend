# 双支付网关系统设计文档

## 🎯 系统概览

本项目实现了一个**生产级双支付网关系统**，支持 Stripe 和 Square 无缝切换，便于开发者根据需求选择最适合的支付方案。

## 📋 核心机制

### 1. 环境变量控制切换
```bash
# 选择支付网关（唯一控制开关）
PAYMENT_GATEWAY=stripe  # 或 square
```

### 2. 独立配置系统
每个网关有完全独立的配置，避免相互干扰：

```javascript
// config.ts
stripe: {
  plans: [
    {
      priceId: "price_1S1k2eKyeXh3bz3dL2jbl2VM", // Stripe Price ID
      name: "Pro",
      price: 12,
      credits: 260
    }
  ]
},
square: {
  plans: [
    {
      priceId: "pro-monthly-subscription", // Square 自定义标识
      name: "Pro", 
      price: 12,
      credits: 260
    }
  ]
}
```

### 3. 统一API接口
前端和后端使用统一接口，自动路由到正确的支付网关：

```javascript
// libs/payment.ts - 统一入口
export async function createCheckout(params) {
  const gateway = getCurrentGateway();
  
  switch (gateway) {
    case 'stripe': return createStripeCheckout(params);
    case 'square': return createSquareCheckout(params);
  }
}
```

## 🔧 部署配置

### Stripe 网关部署
```bash
# 必需的环境变量
PAYMENT_GATEWAY=stripe

# Stripe 密钥
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Square 网关部署  
```bash
# 必需的环境变量
PAYMENT_GATEWAY=square

# Square 密钥
SQUARE_ACCESS_TOKEN=your_production_token
SQUARE_APPLICATION_ID=your_app_id
SQUARE_LOCATION_ID=your_location_id
SQUARE_WEBHOOK_SECRET=your_webhook_secret
SQUARE_ENVIRONMENT=production
```

## 🏗️ 系统架构

### 前端层
```
[价格展示组件] -> getPaymentConfig() -> 显示对应网关的价格和按钮
[支付按钮] -> /api/stripe/create-checkout -> 统一支付API
```

### 后端层
```
[统一支付API] -> libs/payment.ts -> 路由到具体网关实现
[Stripe实现] -> libs/stripe.ts -> 原生Stripe SDK
[Square实现] -> libs/square.ts -> Square SDK
```

### Webhook层
```
[Stripe Webhook] -> /api/webhook/stripe -> 处理Stripe事件
[Square Webhook] -> /api/webhook/square -> 处理Square事件
```

## 🚀 开发工作流

### 本地开发
```bash
# 1. 选择要测试的网关
echo "PAYMENT_GATEWAY=stripe" >> .env.local

# 2. 配置对应网关的测试密钥
# 3. 启动开发服务器
npm run dev

# 4. 控制台会显示当前网关
# 💳 Payment Gateway: STRIPE
```

### 网关切换测试
```bash
# 切换到Square
sed -i 's/PAYMENT_GATEWAY=stripe/PAYMENT_GATEWAY=square/' .env.local

# 重启服务器看到
# 💳 Payment Gateway: SQUARE
```

### 生产部署
```bash
# 1. 选择生产网关
export PAYMENT_GATEWAY=stripe

# 2. 配置生产密钥
export STRIPE_SECRET_KEY=sk_live_...

# 3. 部署应用
npm run build && npm start
```

## 📊 功能对比

| 功能 | Stripe | Square | 说明 |
|------|--------|--------|------|
| 结账会话 | ✅ 完整实现 | 🚧 基础框架 | Square需要安装SDK |
| 客户门户 | ✅ 完整实现 | 🚧 需自建 | Square无直接门户 |
| Webhook | ✅ 完整实现 | 🚧 基础框架 | Square需要完善 |
| 订阅管理 | ✅ 完整实现 | 🚧 需开发 | Square订阅较复杂 |
| 多币种 | ✅ 支持 | ⚠️ 有限支持 | 看具体需求 |

## 🔍 生产就绪检查清单

### Stripe 网关 ✅
- [x] 支付会话创建
- [x] 客户门户管理  
- [x] Webhook 事件处理
- [x] 订阅生命周期管理
- [x] 错误处理和日志
- [x] 积分系统集成

### Square 网关 🚧
- [x] 基础架构框架
- [x] 价格配置系统
- [x] 开发环境演示
- [ ] 生产SDK集成 (`npm install squareup`)
- [ ] Webhook 事件处理完善
- [ ] 订阅管理开发
- [ ] 错误处理完善

## 🎯 推荐部署策略

### 阶段1: Stripe生产部署（立即可用）
```bash
PAYMENT_GATEWAY=stripe
# + 完整的Stripe配置
```
**状态**: ✅ 完全生产就绪

### 阶段2: Square开发完善（需要开发）
1. 安装Square SDK
2. 完善Square API集成
3. 实现Webhook处理
4. 测试订阅流程

### 阶段3: 双网关生产（完整方案）
开发者可以根据业务需求选择最适合的支付网关。

## 🔧 故障排除

### 网关未切换
```bash
# 检查环境变量
echo $PAYMENT_GATEWAY

# 检查控制台输出
# 应该看到: 💳 Payment Gateway: STRIPE
```

### Stripe支付失败
```bash
# 检查密钥配置
echo $STRIPE_SECRET_KEY

# 检查Webhook URL
curl -X POST https://yourdomain.com/api/webhook/stripe
```

### Square支付失败
```bash
# 检查SDK安装
npm list squareup

# 检查Square配置
echo $SQUARE_ACCESS_TOKEN
```

## 📈 业务优势

1. **灵活性**: 根据市场需求快速切换支付方案
2. **风险分散**: 避免单一支付依赖
3. **成本优化**: 选择手续费更优惠的网关
4. **地区适应**: 不同地区使用最适合的支付方式
5. **开发效率**: 统一接口，降低维护成本

---

## 🚀 **当前状态: 生产就绪**

- ✅ **Stripe网关**: 完全可用于生产环境
- 🚧 **Square网关**: 架构完成，需要完善实现
- ✅ **切换机制**: 生产级环境变量控制
- ✅ **向后兼容**: 现有Stripe集成无影响