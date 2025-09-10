# Square OAuth 权限配置

为了使用真正的 Square Subscriptions API，您需要在 Square Developer Dashboard 中更新您的应用程序权限。

## 必需的权限

以下是实现完整订阅功能所需的 OAuth 权限：

### 核心订阅权限
- **SUBSCRIPTIONS_READ**: 读取订阅信息
- **SUBSCRIPTIONS_WRITE**: 创建、更新、暂停、恢复和取消订阅

### 客户管理权限
- **CUSTOMERS_READ**: 读取客户信息
- **CUSTOMERS_WRITE**: 创建和更新客户

### 目录管理权限
- **ITEMS_READ**: 读取目录项目（订阅计划）
- **ITEMS_WRITE**: 创建和更新目录项目（订阅计划）

### 订单和支付权限
- **ORDERS_READ**: 读取订单信息
- **ORDERS_WRITE**: 创建和更新订单
- **PAYMENTS_READ**: 读取支付信息
- **PAYMENTS_WRITE**: 处理支付

### 发票权限（推荐）
- **INVOICES_READ**: 读取发票信息
- **INVOICES_WRITE**: 创建和发送发票

## 配置步骤

1. 访问 [Square Developer Dashboard](https://developer.squareup.com/apps)
2. 选择您的应用程序
3. 转到 "OAuth" 选项卡
4. 在 "Permissions" 部分中，勾选上述所有必需的权限
5. 保存更改

## 环境变量

确保以下环境变量已正确配置：

```env
# Square API 配置
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_ENVIRONMENT=sandbox # 或 production
SQUARE_LOCATION_ID=your_location_id

# Square Webhook 配置
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key
SQUARE_WEBHOOK_NOTIFICATION_URL=https://your-domain.com/api/webhooks/square

# 可选：代理配置
SQUARE_PROXY_URL=https://your-cloudflare-worker-proxy.workers.dev
```

## Webhook 配置

在 Square Developer Dashboard 中配置以下 webhook 事件：

### 订阅事件
- `subscription.created`
- `subscription.updated`
- `subscription.paused`
- `subscription.resumed`
- `subscription.canceled`

### 发票事件
- `invoice.published`
- `invoice.payment_made`
- `invoice.payment_failed`
- `invoice.canceled`
- `invoice.completed`

### 支付事件
- `payment.created`
- `payment.updated`
- `payment.completed`
- `payment.failed`

## 初始化订阅计划

部署后，运行以下 API 端点来初始化订阅计划：

```bash
curl -X POST https://your-domain.com/api/square/subscriptions/initialize \
  -H "Authorization: Bearer your_admin_secret" \
  -H "Content-Type: application/json"
```

## 测试

在沙盒环境中测试以下功能：

1. **创建订阅**：使用真正的 Subscriptions API
2. **处理 webhook 事件**：订阅生命周期事件
3. **管理订阅**：暂停、恢复、取消功能
4. **递归计费**：月度发票和支付处理

## 生产部署检查清单

- [ ] 所有必需的 OAuth 权限已启用
- [ ] Webhook 端点已配置并可访问
- [ ] 环境变量已设置为生产值
- [ ] 订阅计划已初始化
- [ ] 支付流程已在沙盒中测试
- [ ] Webhook 处理已验证

## 故障排除

### 权限错误
如果收到权限相关错误，请检查：
1. OAuth 权限是否已正确配置
2. 访问令牌是否有效
3. 应用程序是否已发布（对于生产环境）

### Webhook 问题
如果 webhook 未触发，请检查：
1. Webhook URL 是否可从公网访问
2. HTTPS 证书是否有效
3. Webhook 签名验证是否正确

### 订阅创建失败
如果订阅创建失败，请检查：
1. 订阅计划是否已通过 Catalog API 创建
2. 客户是否存在或能够成功创建
3. 位置 ID 是否正确