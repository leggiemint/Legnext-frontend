# 🚀 生产环境部署检查清单

## ✅ 已修复的问题

### 1. MongoDB连接问题
- **问题**: `libs/mongo.ts` 在生产环境中禁用了数据库连接
- **修复**: 移除了生产环境的连接限制，现在在所有环境中都可以连接数据库

### 2. NextAuth配置问题
- **问题**: MongoDB适配器未正确配置，导致用户无法保存到数据库
- **修复**: 
  - 正确配置MongoDB适配器
  - 添加了signIn回调来处理Google OAuth用户创建
  - 改进了session回调来正确获取用户ID

### 3. 用户查找逻辑增强
- **问题**: 用户查找逻辑无法正确处理Google ID vs MongoDB ObjectId
- **修复**: 
  - 增强了 `findUserByIdOrEmail` 函数
  - 添加了多重查找策略
  - 添加了联合查询作为后备方案

## 🔧 需要验证的环境变量

确保以下环境变量在Vercel生产环境中正确设置：

```bash
# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-secret

# Google OAuth
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Stripe (如果使用)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🧪 调试工具

创建了调试端点来帮助排查问题：

### `/api/debug/user-lookup`
- 显示当前session信息
- 测试所有用户查找方法
- 显示数据库中的用户列表
- 帮助识别用户查找问题

## 📋 部署后验证步骤

1. **验证数据库连接**
   ```bash
   curl https://your-domain.com/api/debug/user-lookup
   ```

2. **测试Google登录流程**
   - 访问 `/auth/signin`
   - 完成Google OAuth流程
   - 检查是否创建用户记录

3. **验证用户数据获取**
   - 登录后访问 `/api/user/settings`
   - 确认返回用户数据而不是404错误

4. **检查MongoDB数据库**
   - 验证用户记录是否正确创建
   - 确认googleId字段被正确保存

## 🚨 常见问题排查

### 如果仍然出现"User not found"错误：

1. **检查环境变量**
   ```bash
   # 在Vercel中验证
   - MONGODB_URI 是否正确
   - GOOGLE_ID 和 GOOGLE_SECRET 是否匹配
   - NEXTAUTH_SECRET 是否设置
   ```

2. **检查数据库权限**
   - MongoDB集群是否允许从Vercel IP访问
   - 数据库用户是否有读写权限

3. **使用调试端点**
   - 访问 `/api/debug/user-lookup` 查看详细信息
   - 检查哪个查找方法失败了

### 如果Google登录后用户未创建：

1. **检查signIn回调**
   - 查看服务器日志中的错误信息
   - 确认MongoDB连接成功

2. **验证User模型**
   - 确认所有必需字段都有默认值
   - 检查数据库schema是否兼容

## 🔄 回滚方案

如果遇到问题，可以临时回滚到JWT-only模式：

```typescript
// 在 libs/next-auth.ts 中注释掉adapter配置
export const authOptions: NextAuthOptionsExtended = {
  // ...其他配置
  // adapter: MongoDBAdapter(mongoClientPromise), // 注释掉这行
  session: {
    strategy: "jwt", // 确保使用JWT策略
  },
  // ...
};
```

## 📊 监控建议

建议在生产环境中监控以下指标：
- 用户创建成功率
- 登录失败率  
- 数据库连接错误
- NextAuth回调执行时间

## 🎯 下一步优化

1. 添加用户创建失败的重试机制
2. 实现更详细的错误日志记录
3. 添加用户数据迁移工具
4. 优化数据库查询性能
