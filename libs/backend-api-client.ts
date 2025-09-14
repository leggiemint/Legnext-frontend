import { validateAndWarnBackendEndpoint } from './backend-api-validator';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api.legnext.ai';
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

if (!BACKEND_API_KEY) {
  throw new Error('BACKEND_API_KEY environment variable is required');
}

export interface BackendAccount {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  is_enable: boolean;
  account_group: string;
  plan: 'hobbyist' | 'developer';
  type: string;
  api_keys?: BackendApiKey[] | null;
  max_concurrent_task_count: number;
  wallet?: BackendWallet;
  account_tags?: string[] | null;
  notification_hook_url: string;
  equivalent_in_usd?: number;
  credit_pack_info?: CreditPackInfo;
  relax_task_capacity?: number;
  relax_task_capacity_usage?: number;
  input_failure_capacity?: number;
  input_failure_capacity_usage?: number;
}

export interface BackendApiKey {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  revoked: boolean;
  account_id: number;
  value: string;
}

export interface BackendWallet {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  account_id: number;
  credit_packs?: CreditPack[] | null;
  point_remain: number;
  point_frozen: number;
  point_used: number;
  auto_recharge_enabled: boolean;
  auto_recharge_threshold_credit: number;
  auto_recharge_target_credit: number;
  last_auto_recharge_triggered_at: number;
}

export interface CreditPack {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  service_mode: string;
  task_id: string;
  account_id: number;
  task_model: string;
  action: string;
  usage_type: string;
  usage: number;
  status: string;
  detail: any;
  fixed: boolean;
  api_key_id: number;
}

export interface TaskHistoryResponse {
  page: number;
  size: number;
  total: number;
  data: TaskHistory[];
}

export interface Notification {
  id: number;
  created_at: string;
  updated_at: string;
  account_id: number;
  type: string;
  is_confirmed: boolean;
  message: string;
  detail: string;
}

export interface NotificationResponse {
  page: number;
  size: number;
  total: number;
  data: Notification[];
}

export interface JobResponse {
  job_id: string;
  model: string;
  task_type: string;
  status: string;
  config: {
    service_mode: string;
    webhook_config?: {
      endpoint: string;
      secret: string;
    };
  };
  input: any;
  output: {
    image_url: string;
    image_urls?: string[] | null;
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
  detail: any;
  logs: any[];
  error: {
    code: number;
    raw_message: string;
    message: string;
    detail: any;
  };
}

export interface BackendApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

class BackendApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = BACKEND_API_URL;
    this.apiKey = BACKEND_API_KEY;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useUserApiKey?: string
  ): Promise<BackendApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (useUserApiKey) {
      headers['X-API-KEY'] = useUserApiKey;
    } else {
      headers['API-KEY'] = this.apiKey;
    }

    // Validate endpoint in development
    validateAndWarnBackendEndpoint(method, endpoint);

    console.log(`🚀 Backend API Request:`, {
      url,
      method,
      headers: { ...headers, 'API-KEY': headers['API-KEY'] ? '[REDACTED]' : undefined, 'X-API-KEY': headers['X-API-KEY'] ? '[REDACTED]' : undefined },
      body: options.body
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Backend API error: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        console.error('Backend API Error Details:', errorBody);
        errorMessage += ` - ${errorBody}`;
      } catch (e) {
        console.error('Could not parse error response');
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Account Management (using BACKEND_API_KEY)
  async createAccount(params: {
    name: string;
    account_group?: string;
    plan: 'hobbyist' | 'developer';
    type?: string;
  }): Promise<BackendApiResponse<BackendAccount>> {
    return this.request<BackendAccount>('/api/account', {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        account_group: params.account_group || 'user',
        plan: params.plan,
        type: params.type || 'ppu',
      }),
    });
  }

  async getAccountById(accountId: number): Promise<BackendApiResponse<BackendAccount>> {
    return this.request<BackendAccount>(`/api/account/${accountId}`);
  }

  // Note: Backend API doesn't support finding accounts by email
  // Only supports finding by account ID or getting current account with user API key
  async findAccountByEmail(_email: string): Promise<BackendApiResponse<BackendAccount[]>> {
    throw new Error('Backend API does not support finding accounts by email. Use getAccountById or getCurrentAccountInfo with API key instead.');
  }

  async updateAccountPlan(accountId: number, plan: 'hobbyist' | 'developer'): Promise<BackendApiResponse<BackendAccount>> {
    return this.request<BackendAccount>(`/api/account/${accountId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan }),
    });
  }

  async createApiKey(accountId: number, name: string): Promise<BackendApiResponse<BackendApiKey>> {
    return this.request<BackendApiKey>(`/api/account/${accountId}/api_keys`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getAccountApiKeys(accountId: number): Promise<BackendApiResponse<BackendApiKey[]>> {
    return this.request<BackendApiKey[]>(`/api/account/${accountId}/api_keys`);
  }

  async revokeApiKey(accountId: number, apiKeyId: number): Promise<BackendApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/api/account/${accountId}/api_keys/${apiKeyId}/revoke`, {
      method: 'PATCH',
    });
  }

  async getAccountWallet(accountId: number): Promise<BackendApiResponse<BackendWallet>> {
    return this.request<BackendWallet>(`/api/account/${accountId}/wallet`);
  }

  async createCreditPack(accountId: number, params: {
    capacity: number;
    description: string;
    expired_at?: string;
  }): Promise<BackendApiResponse<CreditPack>> {
    return this.request<CreditPack>(`/api/account/${accountId}/wallet/credit_pack?return_credit_pack=true`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getCreditPacks(accountId: number): Promise<BackendApiResponse<CreditPackInfo>> {
    return this.request<CreditPackInfo>(`/api/account/${accountId}/wallet/credit_packs`);
  }

  async getTaskHistories(accountId: number, page = 1, pageSize = 10): Promise<BackendApiResponse<TaskHistoryResponse>> {
    return this.request<TaskHistoryResponse>(`/api/account/${accountId}/task_histories?page=${page}&page_size=${pageSize}`);
  }

  async getNotifications(accountId: number, page = 1, pageSize = 10): Promise<BackendApiResponse<NotificationResponse>> {
    return this.request<NotificationResponse>(`/api/account/${accountId}/notifications?page=${page}&page_size=${pageSize}`);
  }

  async confirmNotification(accountId: number, notificationId: number): Promise<BackendApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/api/account/${accountId}/notification/${notificationId}/confirm?page=1&page_size=null`, {
      method: 'PATCH',
    });
  }

  // User API (using user's own API key)
  async getCurrentAccountInfo(userApiKey: string): Promise<BackendApiResponse<BackendAccount>> {
    return this.request<BackendAccount>('/api/account/info', {}, userApiKey);
  }

  async redeemCode(userApiKey: string, code: string): Promise<BackendApiResponse<BackendWallet>> {
    return this.request<BackendWallet>('/api/account/code/retrieve', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }, userApiKey);
  }

  // Business API (using user's own API key)
  async createDiffusion(userApiKey: string, params: {
    text: string;
    callback?: string;
  }): Promise<JobResponse> {
    const response = await this.request<JobResponse>('/api/v1/diffusion', {
      method: 'POST',
      body: JSON.stringify(params),
    }, userApiKey);
    // Backend API returns the JobResponse directly, not wrapped in {code, data, message}
    return response as unknown as JobResponse;
  }

  async createUpscale(userApiKey: string, params: {
    jobId: string;
    imageNo: number;
    callback?: string;
  }): Promise<JobResponse> {
    const response = await this.request<JobResponse>('/api/v1/upscale', {
      method: 'POST',
      body: JSON.stringify(params),
    }, userApiKey);
    // Backend API returns the JobResponse directly, not wrapped in {code, data, message}
    return response as unknown as JobResponse;
  }

  async getJobStatus(userApiKey: string, jobId: string): Promise<JobResponse> {
    const response = await this.request<JobResponse>(`/api/v1/job/${jobId}`, {}, userApiKey);
    // Backend API returns the JobResponse directly, not wrapped in {code, data, message}
    return response as unknown as JobResponse;
  }
}

export const backendApiClient = new BackendApiClient();