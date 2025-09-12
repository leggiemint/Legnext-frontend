// 用户相关类型定义

// ==========================================
// UserContext 相关类型
// ==========================================

export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: 'free' | 'pro';
  backendAccountId: number | null;
  initApiKey: string | null;
}

export interface BalanceInfo {
  // 原始数据
  remainingCredits: number;
  remainingPoints: number;
  frozenCredits: number;
  frozenPoints: number;
  usedCredits: number;
  usedPoints: number;
  
  // 计算后的余额 (单位：美元)
  totalBalance: number;        // 总余额 = (remainingCredits + remainingPoints) / 1000
  availableBalance: number;    // 可用余额 = (totalBalance - frozen) / 1000
  
  // 信用包详情
  creditPacks: CreditPackDisplayInfo[];
}

export interface CreditPackDisplayInfo {
  id: number;
  capacity: number;
  used: number;
  remaining: number;
  frozen: number;
  description: string;
  expired_at: string;
  active: boolean;
}

// UserContext状态接口
export interface UserContextState {
  // 用户信息
  user: UserInfo | null;
  
  // Balance信息
  balance: BalanceInfo | null;
  
  // 加载状态
  isLoading: boolean;
  isBalanceLoading: boolean;
  
  // 错误状态
  error: string | null;
  
  // 方法
  refreshUserInfo: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

// ==========================================
// 用户偏好设置类型
// ==========================================

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  generation?: {
    defaultModel?: string;
    defaultQuality?: string;
    autoSave?: boolean;
  };
}

// ==========================================
// 用户统计类型
// ==========================================

export interface UserStats {
  totalImagesGenerated: number;
  totalCreditsUsed: number;
  totalCreditsEarned: number;
  memberSince: string;
  lastActive: string;
}

// ==========================================
// 用户操作结果类型
// ==========================================

export interface UserProfileUpdateResult {
  success: boolean;
  message: string;
  updatedFields?: string[];
}

export interface PlanChangeResult {
  success: boolean;
  oldPlan: string;
  newPlan: string;
  message: string;
}