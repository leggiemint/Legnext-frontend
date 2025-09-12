# 简洁前端数据库设计

## 设计原则

前端数据库只存储**必要的用户信息和Backend系统关联数据**，所有业务数据都直接从Backend系统获取。

## 表结构

### 1. NextAuth 认证表 (标准NextAuth.js表)
- `User` - 基础用户信息
- `Account` - OAuth账户关联  
- `Session` - 用户会话
- `VerificationToken` - 邮箱验证令牌

### 2. UserProfile - 用户档案和Backend集成
**核心字段：**
- `backendAccountId` - Backend系统账户ID (重要的检索关键字)
- `initApiKey` - 用户初始API密钥 (用于前端直接体验业务API)
- `plan` - 当前计划 ("free" | "pro", 前端显示用)
- `preferences` - 用户偏好设置 (JSON格式)

### 3. PaymentCustomer - 支付系统集成
- `stripeCustomerId` - Stripe客户ID (用于支付处理)

## 数据流设计

### 用户注册流程：
1. NextAuth处理OAuth登录 → 创建User记录
2. 自动在Backend系统创建账户 → 获取backendAccountId和initApiKey  
3. 在前端数据库创建UserProfile记录

### 数据获取策略：
- **前端数据库存储：** 认证信息、Backend关联ID、基础设置
- **Backend系统获取：** 信用余额、任务历史、通知、详细业务数据

### Plan映射：
- 前端: `free` ↔ Backend: `hobbyist`
- 前端: `pro` ↔ Backend: `developer`

## API调用模式

```typescript
// 1. 获取用户基础信息（前端数据库）
const user = await getUserWithProfile(userId);

// 2. 获取实时业务数据（Backend API）
const creditInfo = await backendApiClient.getCurrentAccountInfo(user.profile.initApiKey);

// 3. 执行业务操作（Backend API）
const job = await backendApiClient.createDiffusion(user.profile.initApiKey, { text: "prompt" });
```

## 优势

1. **性能优化** - 减少不必要的前端数据存储
2. **数据一致性** - 业务数据直接从Backend获取，避免同步问题
3. **简化维护** - 前端数据库结构简洁，易于维护
4. **用户体验** - initApiKey存储在前端，用户可直接体验业务功能