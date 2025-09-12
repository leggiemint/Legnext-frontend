# UserContext 全局状态管理

统一的用户状态管理Context，提供用户信息、余额信息等关键数据，供整个应用复用。

## 核心功能

### 1. 用户基础信息
- 用户ID、邮箱、姓名、头像
- 当前计划 (free/pro)
- Backend账户关联信息
- 初始API密钥

### 2. 余额计算系统
- **Credits & Points 统一管理**
- **余额计算公式**: `Balance$ = (remainingCredits + remainingPoints) / 1000`
- **汇率**: 1$ = 1000 credits = 1000 points
- **实时同步**: 每30秒自动刷新余额数据

### 3. 状态管理
- 自动加载和缓存
- 错误处理和重试机制
- 加载状态指示
- 实时数据同步

## Balance计算逻辑

```typescript
// 余额计算公式
totalBalance = (remainingCredits + remainingPoints) / 1000
availableBalance = (remainingCredits + remainingPoints - frozenCredits - frozenPoints) / 1000

// 示例：
// remainingCredits: 5000
// remainingPoints: 3000
// frozenCredits: 1000
// frozenPoints: 500

// totalBalance = (5000 + 3000) / 1000 = $8.00
// availableBalance = (5000 + 3000 - 1000 - 500) / 1000 = $6.50
```

## 使用方法

### 1. Provider设置
```tsx
import { UserContextProvider } from '@/contexts/UserContext';

function App() {
  return (
    <UserContextProvider>
      {/* 你的应用组件 */}
    </UserContextProvider>
  );
}
```

### 2. Hooks使用

#### 获取完整用户状态
```tsx
import { useUser } from '@/contexts/UserContext';

function MyComponent() {
  const { 
    user,           // 用户基础信息
    balance,        // 余额信息
    isLoading,      // 加载状态
    error,          // 错误信息
    refreshAll      // 刷新所有数据
  } = useUser();
}
```

#### 仅获取用户信息
```tsx
import { useUserInfo } from '@/contexts/UserContext';

function UserProfile() {
  const { user, isLoading, error } = useUserInfo();
  
  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
      <span>Plan: {user?.plan}</span>
    </div>
  );
}
```

#### 仅获取余额信息
```tsx
import { useBalance } from '@/contexts/UserContext';

function BalanceDisplay() {
  const { balance, isLoading, error } = useBalance();
  
  return (
    <div>
      <p>Available: ${balance?.availableBalance.toFixed(2)}</p>
      <p>Total: ${balance?.totalBalance.toFixed(2)}</p>
    </div>
  );
}
```

#### 获取用户计划
```tsx
import { useUserPlan } from '@/contexts/UserContext';

function PlanBadge() {
  const plan = useUserPlan(); // 'free' | 'pro'
  
  return (
    <span className={plan === 'pro' ? 'text-purple-600' : 'text-gray-600'}>
      {plan.toUpperCase()}
    </span>
  );
}
```

### 3. 组件复用

#### 用户信息组件
```tsx
import { UserInfo } from '@/components/UserInfo';

// 紧凑显示（适用于Header）
<UserInfo variant="compact" showPlan={true} />

// 详细显示（适用于Sidebar）
<UserInfo variant="detailed" showPlan={true} showEmail={true} />

// 仅头像显示（适用于移动端）
<UserInfo variant="avatar-only" />
```

#### 余额显示组件
```tsx
import { UserBalance } from '@/components/UserBalance';

// 最小显示（仅金额）
<UserBalance variant="minimal" />

// 紧凑显示（适用于Header）
<UserBalance variant="compact" showRefresh={true} />

// 详细显示（适用于Dashboard）
<UserBalance variant="detailed" showRefresh={true} />
```

## 数据结构

### UserInfo
```typescript
interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: 'free' | 'pro';
  backendAccountId: number | null;
  initApiKey: string | null;
}
```

### BalanceInfo
```typescript
interface BalanceInfo {
  // 原始数据
  remainingCredits: number;
  remainingPoints: number;
  frozenCredits: number;
  frozenPoints: number;
  usedCredits: number;
  usedPoints: number;
  
  // 计算后的余额（美元）
  totalBalance: number;
  availableBalance: number;
  
  // 信用包详情
  creditPacks: CreditPackInfo[];
}
```

## 格式化工具函数

```tsx
import { formatBalance, formatCredits, formatPoints } from '@/contexts/UserContext';

const balance = 8.50;
const credits = 5000;
const points = 3000;

formatBalance(balance);  // "$8.50"
formatCredits(credits);  // "5,000 credits"
formatPoints(points);    // "3,000 points"
```

## 实际应用示例

### Header中使用
```tsx
function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <h1>Legnext</h1>
      <div className="flex items-center gap-4">
        <UserBalance variant="compact" />
        <UserInfo variant="compact" showPlan={true} />
      </div>
    </header>
  );
}
```

### Dashboard中使用
```tsx
function Dashboard() {
  const { user, balance } = useUser();
  
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <h2>Welcome, {user?.name}!</h2>
        <p>Your current plan: {user?.plan}</p>
      </div>
      <div>
        <UserBalance variant="detailed" showRefresh={true} />
      </div>
    </div>
  );
}
```

## 性能优化

- ✅ 自动缓存用户数据
- ✅ 智能刷新机制（仅在需要时更新）
- ✅ 防抖处理避免频繁请求
- ✅ 分离loading状态（用户信息 vs 余额信息）
- ✅ 组件级别的优化（避免不必要的重渲染）

## API Key 管理

### 功能特性

1. **Init Key 保护**: 用户注册时的初始API key不显示撤销按钮
2. **创建新Key**: 用户可以创建多个自定义名称的API key
3. **安全显示**: 每个key只在创建时显示完整值，之后只显示掩码
4. **撤销管理**: 非init key显示撤销按钮，可以正常撤销

### API Key 页面功能

- **创建API Key**: 输入名称创建新的API key
- **安全显示**: 所有key都显示掩码版本，保护隐私
- **临时复制**: 新创建的key在创建时显示完整值并支持复制
- **撤销功能**: 只能撤销非init key
- **状态管理**: 清晰显示key的激活/撤销状态

## 注意事项

1. **Provider位置**: UserContextProvider必须包裹在SessionProvider内部
2. **权限验证**: Context会自动处理用户认证状态
3. **错误处理**: 所有API调用都有完善的错误处理
4. **实时性**: 余额数据每30秒自动刷新，确保数据实时性
5. **类型安全**: 完整的TypeScript类型定义
6. **API Key安全**: Init key受保护，新key只在创建时显示完整值