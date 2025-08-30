# Google 登录迁移指南

## 问题描述

在 Vercel 部署后，Google 登录出现以下错误：

```
CastError: Cast to ObjectId failed for value "111984578800890737657" (type string) at path "_id" for model "User"
```

这是因为 Google 登录返回的用户 ID 是字符串格式（如 `"111984578800890737657"`），而不是 MongoDB 的 ObjectId 格式。

## 解决方案

我们已经修改了代码逻辑，使其能够：
1. 首先尝试通过用户 ID 查询用户
2. 如果失败，则通过用户的 email 地址查询用户
3. 添加了 `googleId` 字段来存储 Google 返回的用户 ID

## 迁移步骤

### 1. 运行迁移脚本

在本地环境中运行迁移脚本：

```bash
# 确保环境变量已设置
cp .env.example .env.local
# 编辑 .env.local 文件，设置 MONGODB_URI

# 运行迁移脚本
node scripts/migrate-google-login.js
```

### 2. 迁移脚本功能

迁移脚本会：

- ✅ 为现有的 Google 登录用户添加 `googleId` 字段
- ✅ 确保所有用户都有必要的字段结构
- ✅ 添加数据库索引以提高性能
- ✅ 处理可能的重复用户问题

### 3. 验证迁移

迁移完成后，检查输出信息：

```
📈 Migration Summary:
✅ Successfully migrated: X users
⏩ Skipped (already migrated): Y users
📱 Google users found: Z users
📊 Total users processed: N users
```

### 4. 部署更新

1. 提交所有代码更改
2. 推送到 Git 仓库
3. Vercel 会自动部署更新

## 代码更改说明

### 1. NextAuth 配置更新

- 修改了 `libs/next-auth.ts`，支持 MongoDB 适配器
- 更新了 session 和 JWT 回调函数

### 2. 用户查询逻辑更新

- 修改了 `libs/user.ts` 中的用户查询函数
- 添加了通过 email 查询用户的回退机制
- 更新了所有相关的用户操作函数

### 3. API 路由更新

- 修改了 `/api/user/settings` 路由
- 修改了 `/api/stripe/create-checkout` 路由
- 修改了 `/api/debug/user-status` 路由

### 4. 用户模型更新

- 在 `models/User.ts` 中添加了 `googleId` 字段
- 设置了适当的索引和验证规则

## 测试验证

### 1. 本地测试

```bash
# 启动开发服务器
npm run dev

# 测试 Google 登录
# 访问 http://localhost:3000/auth/signin
# 使用 Google 账号登录
# 检查是否能够正常访问用户设置页面
```

### 2. 生产环境测试

1. 部署到 Vercel 后
2. 使用 Google 账号登录
3. 检查用户设置 API 是否正常工作
4. 验证没有 ObjectId 转换错误

## 故障排除

### 1. 迁移失败

如果迁移脚本失败：

```bash
# 检查 MongoDB 连接
echo $MONGODB_URI

# 检查数据库权限
# 确保数据库用户有读写权限

# 手动检查用户数据
# 连接到 MongoDB 并检查 users 集合
```

### 2. 登录仍然失败

如果 Google 登录仍然失败：

1. 检查浏览器控制台错误信息
2. 检查 Vercel 函数日志
3. 确认所有代码更改已部署
4. 验证环境变量设置正确

### 3. 用户数据不完整

如果用户数据不完整：

1. 重新运行迁移脚本
2. 检查数据库中的用户文档
3. 确认所有必要字段都已添加

## 注意事项

- ⚠️ 迁移脚本会修改数据库，请在运行前备份数据
- ⚠️ 确保在生产环境运行前先在开发环境测试
- ⚠️ 迁移完成后，新用户注册会自动包含所有必要字段
- ⚠️ 现有用户的数据结构会被更新，但不会丢失数据

## 联系支持

如果遇到问题，请：

1. 检查 Vercel 函数日志
2. 查看浏览器控制台错误
3. 运行迁移脚本并查看输出
4. 提供详细的错误信息和环境信息
