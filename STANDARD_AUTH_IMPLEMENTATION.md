# 🎯 标准NextAuth + MongoDB实施方案

## 📋 问题分析

**根本原因**: 混合使用自定义User模型和NextAuth MongoDB适配器导致的架构冲突

**现象**: 
- 本地开发正常（可能使用JWT模式）
- 生产环境session存在但数据库中无用户记录
- 浏览器显示已登录但后端API找不到用户

## 🏗️ 标准架构方案

### 架构分离原则

```
NextAuth管理层:
├── users (NextAuth标准表)
├── accounts (OAuth账户关联)
├── sessions (会话管理)
└── verification_tokens (验证令牌)

业务数据层:
└── userprofiles (业务相关数据)
    ├── userId -> 引用NextAuth users._id
    ├── plan, credits, preferences
    └── subscription, usage等业务字段
```

### 关键优势

✅ **完全符合NextAuth标准** - 无自定义冲突  
✅ **生产环境稳定** - 官方支持的架构  
✅ **业务数据独立** - 清晰的关注点分离  
✅ **易于维护** - 标准化的代码结构  

## 🚀 实施步骤

### 1. 检查当前状态

```bash
node scripts/migrate-to-standard-auth.js check
```

### 2. 运行迁移

```bash
node scripts/migrate-to-standard-auth.js migrate
```

### 3. 更新代码引用

替换原有的用户API调用：

```typescript
// 旧方式
import { getUserDashboardData } from "@/libs/user";

// 新方式  
import { getCurrentUser } from "@/libs/user-service";
```

### 4. 测试新端点

```bash
# 测试新的用户设置API
curl https://your-domain.com/api/user/settings-new
```

## 🔧 关键配置文件

### 1. NextAuth配置 (`libs/next-auth.ts`)

```typescript
// 标准MongoDB适配器配置
export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(mongoClientPromise),
  session: { strategy: "database" },
  // 最小化自定义回调
}
```

### 2. 用户服务 (`libs/user-service.ts`)

```typescript
// 统一的用户数据获取
export async function getCurrentUser(): Promise<UserWithProfile | null>

// 业务数据操作
export async function updateUserPreferences(userId: string, preferences: any)
export async function grantCredits(userId: string, amount: number)
```

### 3. 业务数据模型 (`models/UserProfile.ts`)

```typescript
// 与NextAuth用户表分离的业务数据
const userProfileSchema = new mongoose.Schema({
  userId: String, // 引用NextAuth users._id
  plan: String,
  credits: Object,
  preferences: Object,
  // 其他业务字段...
})
```

## 📊 迁移过程

### 迁移前

```
users集合 (自定义结构)
├── email, name, image
├── googleId (自定义字段)
├── plan, credits (业务数据)
└── preferences (业务数据)
```

### 迁移后

```
users集合 (NextAuth标准)
├── email, name, image
├── emailVerified
└── 标准NextAuth字段

userprofiles集合 (业务数据)
├── userId (引用users._id)
├── plan, credits
├── preferences
└── 其他业务字段
```

## 🧪 验证步骤

### 1. 清除浏览器session

```bash
# 访问清除session端点
curl https://your-domain.com/api/debug/clear-session
```

### 2. 重新登录测试

1. 访问 `/auth/signin`
2. 完成Google OAuth流程
3. 检查数据库中的users和userprofiles集合
4. 测试 `/api/user/settings-new` 端点

### 3. 验证数据完整性

```bash
# 检查迁移结果
node scripts/migrate-to-standard-auth.js check
```

## 🔄 回滚计划

如果需要回滚：

1. 停止新代码部署
2. 从备份恢复原始users集合
3. 重新部署旧版本代码

## 📈 性能优化

### 数据库索引

```javascript
// UserProfile集合索引
db.userprofiles.createIndex({ userId: 1 }, { unique: true })
db.userprofiles.createIndex({ plan: 1 })
db.userprofiles.createIndex({ subscriptionStatus: 1 })
```

### 查询优化

```typescript
// 高效的用户数据获取
const user = await getCurrentUser(); // 一次查询获取完整数据
```

## 🚨 注意事项

### 环境变量

确保生产环境设置：

```bash
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret
```

### 数据库权限

- 确保MongoDB用户有读写权限
- 检查网络访问白名单
- 验证连接字符串格式

## 🎯 预期结果

迁移完成后：

✅ Google登录创建标准NextAuth用户记录  
✅ 业务数据自动关联到UserProfile  
✅ 生产环境session和数据库状态同步  
✅ API端点正常返回用户数据  
✅ 不再出现"User not found"错误  

## 📞 支持

如遇问题，检查：

1. 服务器日志中的详细错误信息
2. MongoDB连接状态
3. NextAuth回调执行日志
4. 环境变量配置

---

**这是行业标准的NextAuth + MongoDB架构，确保了生产环境的稳定性和可维护性。**
