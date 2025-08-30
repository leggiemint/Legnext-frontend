# 🚀 生产环境数据库迁移步骤

## 📋 需要迁移的原因

基于我们刚才的修复，需要进行数据库迁移来确保：

1. **现有用户能正常登录** - 确保所有用户都有 `googleId` 字段
2. **完整的用户数据结构** - 确保所有必需字段都存在
3. **正确的数据库索引** - 优化查询性能

## 🔧 迁移方案选择

### 方案1: 使用现有迁移脚本 (推荐)

```bash
# 1. 首先运行用户schema迁移
node scripts/migrate-user-schema.js

# 2. 然后运行Google登录专用迁移  
node scripts/migrate-google-login.js
```

### 方案2: 使用API端点迁移

```bash
# 访问以下URL或使用curl
curl -X POST https://your-domain.com/api/migrate/user-schema
```

## ⚡ 快速迁移执行

**立即执行以下命令：**

```bash
# 在项目根目录下执行
npm run migrate:users
# 或者
node scripts/migrate-user-schema.js && node scripts/migrate-google-login.js
```

## 📊 迁移内容详情

### 1. 用户Schema迁移 (`migrate-user-schema.js`)
- ✅ 添加 `plan` 字段 (默认: "free")
- ✅ 添加 `subscriptionStatus` 字段 (默认: "inactive") 
- ✅ 添加 `credits` 对象结构
- ✅ 添加 `preferences` 对象
- ✅ 添加 `monthlyUsage` 跟踪
- ✅ 添加 `totalAvatarsCreated` 计数

### 2. Google登录迁移 (`migrate-google-login.js`)
- ✅ 为现有用户添加 `googleId` 字段
- ✅ 处理Google OAuth ID与MongoDB ObjectId的映射
- ✅ 确保所有Google用户都能被正确识别
- ✅ 添加必要的数据库索引

## 🛡️ 安全保障

- **非破坏性**: 只添加字段，不修改现有数据
- **幂等性**: 可以多次运行，不会重复迁移
- **回滚友好**: 新字段可以安全删除

## ⚠️ 重要提醒

1. **在生产环境运行前**，先在开发环境测试
2. **备份数据库** (推荐但非必须，迁移是安全的)
3. **检查环境变量** 确保 `MONGODB_URI` 正确设置

## 🚦 执行顺序

```bash
# 1. 准备环境变量
cp .env.example .env.local
# 编辑 .env.local 设置 MONGODB_URI

# 2. 运行迁移
node scripts/migrate-user-schema.js
node scripts/migrate-google-login.js

# 3. 验证迁移结果
# 查看控制台输出的迁移摘要

# 4. 重新部署到Vercel
git add .
git commit -m "Fix production auth issues and run migrations"
git push
```

## 📈 预期结果

迁移完成后，您应该看到类似输出：

```
📈 Migration Summary:
✅ Successfully migrated: X users
⏩ Skipped (already migrated): Y users  
📱 Google users found: Z users
📊 Total users processed: N users

🎉 Migration completed successfully!
```

## 🧪 验证迁移成功

1. **检查用户能否登录**:
   ```bash
   # 访问您的站点并使用Google登录
   https://your-domain.com/auth/signin
   ```

2. **测试用户数据获取**:
   ```bash
   # 登录后访问用户设置
   https://your-domain.com/api/user/settings
   ```

3. **使用调试端点**:
   ```bash
   # 查看详细的用户查找信息
   https://your-domain.com/api/debug/user-lookup
   ```

## 🚨 如果遇到问题

1. **检查迁移日志** - 查看控制台输出的详细信息
2. **验证数据库连接** - 确保 `MONGODB_URI` 正确
3. **检查数据库权限** - 确保有读写权限
4. **联系支持** - 提供迁移日志和错误信息

---

**⏰ 建议立即执行迁移，然后重新部署到Vercel！**
