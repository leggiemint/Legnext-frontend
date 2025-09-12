// API相关类型定义

// ==========================================
// 通用API响应类型
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  size: number;
  total: number;
  totalPages?: number;
}

// ==========================================
// Backend API 类型
// ==========================================

export interface BackendApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export interface BackendAccount {
  id: number;
  name: string;
  plan: 'hobbyist' | 'developer';
  is_enable: boolean;
  api_keys?: BackendApiKey[];
  wallet?: BackendWallet;
  equivalent_in_usd?: number;
  credit_pack_info?: CreditPackInfo;
}

export interface BackendApiKey {
  id: number;
  name: string;
  value: string;
  revoked: boolean;
  account_id: number;
  created_at: string;
}

export interface BackendWallet {
  id: number;
  account_id: number;
  point_remain: number;
  point_frozen: number;
  point_used: number;
  auto_recharge_enabled: boolean;
  auto_recharge_threshold_credit: number;
  auto_recharge_target_credit: number;
  credit_packs?: CreditPack[];
}

export interface CreditPack {
  id: number;
  wallet_id: number;
  account_id: number;
  active: boolean;
  capacity: number;
  frozen: number;
  used: number;
  effective_at: string;
  expired_at: string;
  description: string;
}

export interface CreditPackInfo {
  credit_packs_count: number;
  total_credits: number;
  frozen_credits: number;
  used_credits: number;
  expired_credits: number;
  inactive_credits: number;
  available_credits: number;
  credit_packs: CreditPack[];
}

export interface TaskHistory {
  id: number;
  task_id: string;
  account_id: number;
  task_model: string;
  action: string;
  usage_type: string;
  usage: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: number;
  account_id: number;
  type: string;
  is_confirmed: boolean;
  message: string;
  detail: string;
  created_at: string;
}

// ==========================================
// Stripe API 类型
// ==========================================

export interface StripeSubscription {
  id: string;
  status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'past_due';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  ended_at: number | null;
  price: {
    id: string;
    amount: number;
    currency: string;
    interval: string;
  };
  latest_invoice?: string;
}

export interface StripeInvoice {
  id: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  created: number;
  due_date: number | null;
  period_start: number | null;
  period_end: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  subscription: string | null;
  billing_reason: string;
}

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

// ==========================================
// 图像生成API类型
// ==========================================

export interface GenerationJob {
  job_id: string;
  model: string;
  task_type: 'diffusion' | 'upscale';
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'canceled';
  input?: any;
  output: {
    image_url: string;
    image_urls?: string[];
  };
  meta: {
    created_at: string;
    started_at: string;
    ended_at: string;
    usage: {
      type: string;
      frozen: number;
      consume: number;
    };
  };
  error?: {
    code: number;
    message: string;
    detail?: any;
  };
}

export interface DiffusionRequest {
  text: string;
  callback?: string;
}

export interface UpscaleRequest {
  jobId: string;
  imageNo: number;
  callback?: string;
}

// ==========================================
// 用户相关类型
// ==========================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: 'free' | 'pro';
  backendAccountId: number | null;
  initApiKey: string | null;
  preferences?: Record<string, any>;
}

export interface UserBalance {
  remainingCredits: number;
  remainingPoints: number;
  frozenCredits: number;
  frozenPoints: number;
  usedCredits: number;
  usedPoints: number;
  totalBalance: number;
  availableBalance: number;
  creditPacks: CreditPackInfo[];
}

// ==========================================
// 错误类型
// ==========================================

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ==========================================
// 请求和响应工厂类型
// ==========================================

export type RequestPayload<T = any> = T;
export type ResponseData<T = any> = ApiResponse<T>;
export type PaginatedData<T = any> = PaginatedResponse<T>;