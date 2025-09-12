# Hooks 重构文档

基于新架构重构的React Hooks，提供backend API、Stripe支付、图像生成等功能的封装。

## 架构说明

### 设计原则
- **专一职责** - 每个hook专注于特定功能域
- **与Context配合** - 依赖UserContext获取用户状态
- **错误处理** - 统一的错误处理和状态管理
- **实时更新** - 自动轮询和状态同步

## Hook分类

### 1. Backend API Hooks (`useBackendAccount.ts`)

#### `useBackendAccount()`
获取当前用户的backend账户信息
```tsx
const { account, isLoading, error, refetch } = useBackendAccount();
```

#### `useBackendTaskHistories(page, pageSize)`
获取任务历史记录
```tsx
const { 
  taskHistories, 
  pagination, 
  isLoading, 
  error, 
  refetch 
} = useBackendTaskHistories(1, 10);
```

#### `useBackendNotifications(page, pageSize)`
获取和管理通知
```tsx
const { 
  notifications, 
  pagination, 
  isLoading, 
  error, 
  refetch, 
  confirmNotification 
} = useBackendNotifications(1, 10);

// 确认通知
await confirmNotification(notificationId);
```

#### `useBackendCreditPacks()`
获取信用包详情
```tsx
const { 
  creditPacks, 
  summary, 
  isLoading, 
  error, 
  refetch 
} = useBackendCreditPacks();
```

#### `useRedeemCode()`
兑换码功能
```tsx
const { redeemCode, isRedeeming, error } = useRedeemCode();

// 使用兑换码
try {
  await redeemCode('your-code-here');
} catch (err) {
  console.error('兑换失败:', err.message);
}
```

### 2. Stripe支付Hooks (`useStripe.ts`)

#### `useStripeSubscription()`
订阅管理
```tsx
const { 
  subscriptions, 
  activeSubscription, 
  hasActiveSubscription, 
  isLoading, 
  error, 
  refetch, 
  cancelSubscription, 
  resumeSubscription, 
  createCheckoutSession 
} = useStripeSubscription();

// 取消订阅
await cancelSubscription('sub_xxx', false); // false = 期末取消

// 恢复订阅
await resumeSubscription('sub_xxx');
```

#### `useStripeInvoices(limit)`
发票管理
```tsx
const { 
  invoices, 
  isLoading, 
  error, 
  refetch, 
  fetchInvoiceDetails 
} = useStripeInvoices(10);

// 获取发票详情
const invoice = await fetchInvoiceDetails('in_xxx');
```

#### `useStripeCheckout()`
结账流程
```tsx
const { createCheckoutSession, isCreating, error } = useStripeCheckout();

// 创建订阅结账
await createCheckoutSession('price_xxx', {
  successUrl: '/success',
  cancelUrl: '/cancel'
});
```

#### `useSubscriptionStatus()`
订阅状态辅助hook
```tsx
const { 
  isPro, 
  isTrialing, 
  isCanceled, 
  isActive, 
  periodEnd, 
  daysUntilEnd, 
  subscription, 
  isLoading 
} = useSubscriptionStatus();
```

### 3. 图像生成Hooks (`useImageGeneration.ts`)

#### `useImageGeneration()`
主图像生成hook
```tsx
const { 
  jobs, 
  isGenerating, 
  error, 
  generateImage, 
  upscaleImage, 
  getJob, 
  refreshJob, 
  cleanup 
} = useImageGeneration();

// 生成图像
const job = await generateImage('A beautiful sunset');

// 高清放大
const upscaleJob = await upscaleImage('parent-job-id', 0);
```

#### `useJobStatus(jobId)`
单个任务状态监控
```tsx
const { job, isLoading, error, refetch } = useJobStatus('job-id');
```

#### `useBatchGeneration()`
批量图像生成
```tsx
const { 
  batchJobs, 
  isProcessing, 
  completedCount, 
  totalCount, 
  progress, 
  generateBatch 
} = useBatchGeneration();

// 批量生成
const prompts = ['sunset', 'mountain', 'ocean'];
await generateBatch(prompts);
```

## 使用示例

### Dashboard页面
```tsx
import { useUser } from '@/contexts/UserContext';
import { useBackendAccount, useBackendCreditPacks } from '@/hooks/useBackendAccount';
import { useStripeSubscription } from '@/hooks/useStripe';

function Dashboard() {
  const { user, balance } = useUser();
  const { account } = useBackendAccount();
  const { creditPacks } = useBackendCreditPacks();
  const { activeSubscription } = useStripeSubscription();

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>Plan: {user?.plan}</p>
      <p>Balance: ${balance?.availableBalance}</p>
      
      {activeSubscription && (
        <div>Active Subscription: {activeSubscription.id}</div>
      )}
      
      <div>
        <h3>Credit Packs</h3>
        {creditPacks.map(pack => (
          <div key={pack.id}>
            {pack.description}: {pack.remaining}/{pack.capacity}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 图像生成页面
```tsx
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useBalance } from '@/contexts/UserContext';

function ImageGenerator() {
  const { generateImage, jobs, isGenerating } = useImageGeneration();
  const { balance } = useBalance();
  
  const handleGenerate = async () => {
    if (balance && balance.availableBalance > 0.04) { // $0.04 ≈ 40 points
      await generateImage('A beautiful landscape');
    }
  };

  return (
    <div>
      <button 
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Image'}
      </button>
      
      <div>
        {jobs.map(job => (
          <div key={job.jobId}>
            <p>Status: {job.status}</p>
            {job.imageUrl && <img src={job.imageUrl} alt="Generated" />}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 订阅管理页面
```tsx
import { useStripeSubscription, useSubscriptionStatus } from '@/hooks/useStripe';

function SubscriptionPage() {
  const { cancelSubscription, resumeSubscription } = useStripeSubscription();
  const { isPro, isCanceled, daysUntilEnd } = useSubscriptionStatus();
  
  return (
    <div>
      {isPro ? (
        <div>
          <p>You are on Pro plan</p>
          {isCanceled ? (
            <div>
              <p>Subscription will end in {daysUntilEnd} days</p>
              <button onClick={() => resumeSubscription('sub_id')}>
                Resume Subscription
              </button>
            </div>
          ) : (
            <button onClick={() => cancelSubscription('sub_id', false)}>
              Cancel at Period End
            </button>
          )}
        </div>
      ) : (
        <p>You are on Free plan</p>
      )}
    </div>
  );
}
```

## 错误处理模式

所有hooks都遵循统一的错误处理模式：

```tsx
const { data, isLoading, error, refetch } = useHook();

if (error) {
  return <div>Error: {error}</div>;
}

if (isLoading) {
  return <div>Loading...</div>;
}

return <div>{/* 正常内容 */}</div>;
```

## 性能优化

### 自动轮询
- 图像生成任务自动轮询状态直到完成
- 30秒超时机制防止无限轮询
- 任务完成后自动刷新用户余额

### 状态缓存
- hooks自动缓存数据减少重复请求  
- 智能刷新机制（仅在需要时更新）
- 组件卸载时自动清理资源

### 批量处理
- 支持批量图像生成
- 进度跟踪和错误恢复
- 防抖机制避免频繁API调用

## 注意事项

1. **依赖UserContext**: 所有hooks都依赖UserContext提供的用户信息
2. **错误边界**: 建议在使用hooks的组件外包裹ErrorBoundary
3. **资源清理**: useImageGeneration会自动清理轮询定时器
4. **权限验证**: hooks会自动处理用户认证状态
5. **类型安全**: 完整的TypeScript类型定义