// 后端系统API客户端
// 用于与Legnext后端系统进行账户同步和管理

// 后端账户创建请求接口
export interface BackendAccountRequest {
  name: string;
  account_group: string;
  type: string;
  plan: string;
  max_concurrent_task_count: number;
  credit_remain: number;
  mj_quota_remain: number;
}

// 后端账户响应接口 - 更新为完整结构
export interface BackendAccountResponse {
  code: number;
  data: {
    id: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    name: string;
    is_enable: boolean;
    account_group: string;
    plan: string;
    type: string;
    api_keys: {
      id: number;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      name: string;
      revoked: boolean;
      account_id: number;
      value: string;
    }[];
    max_concurrent_task_count: number;
    wallet: {
      id: number;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      account_id: number;
      credit_packs: CreditPack[] | null; // 可能为null或数组
      point_remain: number;
      point_frozen: number;
      point_used: number;
      auto_recharge_enabled: boolean;
      auto_recharge_threshold_credit: number;
      auto_recharge_target_credit: number;
      last_auto_recharge_triggered_at: number;
    };
    account_tags: any[];
    notification_hook_url: string;
    // 新增字段
    relax_task_capacity: number;
    relax_task_capacity_usage: number;
    input_failure_capacity: number;
    input_failure_capacity_usage: number;
  };
  message: string;
}

// API Key相关接口
export interface ApiKeyResponse {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  revoked: boolean;
  account_id: number;
  value: string;
}

export interface CreateApiKeyRequest {
  name?: string;
}

// Credits操作接口
export interface UpdateCreditsRequest {
  type: "credit"; // 固定值
  amount: number; // 正数表示要增加的数量
  description?: string;
}

// Credit Pack接口
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

// 增强的Wallet接口
export interface EnhancedWallet {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  account_id: number;
  credit_packs: CreditPack[];
  point_remain: number;
  point_frozen: number;
  point_used: number;
  auto_recharge_enabled: boolean;
  auto_recharge_threshold_credit: number;
  auto_recharge_target_credit: number;
  last_auto_recharge_triggered_at: number;
}

// 获取后端管理系统URL
function getBaseManagerUrl(): string {
  const url = process.env.BASE_MANAGER_URL || process.env.NEXT_PUBLIC_BASE_MANAGER_URL;
  console.log(`🔍 [DEBUG] Backend URL check:`, {
    BASE_MANAGER_URL: process.env.BASE_MANAGER_URL ? 'SET' : 'NOT_SET',
    NEXT_PUBLIC_BASE_MANAGER_URL: process.env.NEXT_PUBLIC_BASE_MANAGER_URL ? 'SET' : 'NOT_SET',
    resolvedUrl: url
  });
  
  if (!url) {
    console.error('❌ [ERROR] BASE_MANAGER_URL environment variable is not configured');
    throw new Error('BASE_MANAGER_URL environment variable is not configured');
  }
  return url;
}

// 获取后端API密钥
function getBackendApiKey(): string {
  const apiKey = process.env.BACKEND_API_KEY || process.env.NEXT_PUBLIC_BACKEND_API_KEY;
  console.log(`🔍 [DEBUG] Backend API Key check:`, {
    BACKEND_API_KEY: process.env.BACKEND_API_KEY ? 'SET' : 'NOT_SET',
    NEXT_PUBLIC_BACKEND_API_KEY: process.env.NEXT_PUBLIC_BACKEND_API_KEY ? 'SET' : 'NOT_SET',
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 6) + '...' : 'NONE'
  });
  
  if (!apiKey) {
    console.error('❌ [ERROR] BACKEND_API_KEY environment variable is not configured');
    throw new Error('BACKEND_API_KEY environment variable is not configured');
  }
  return apiKey;
}

// 生成认证headers
function getAuthHeaders(): { [key: string]: string } {
  const headers = {
    'Content-Type': 'application/json',
    'API-KEY': getBackendApiKey()
  };
  
  console.log(`🔍 [DEBUG] Generated headers:`, {
    'Content-Type': headers['Content-Type'],
    'API-KEY': headers['API-KEY'] ? `${headers['API-KEY'].substring(0, 6)}...` : 'NONE'
  });
  
  return headers;
}

// 创建后端账户
export async function createBackendAccount(params: {
  email: string;
  plan?: string;
  creditRemain?: number;
  mjQuotaRemain?: number;
}): Promise<BackendAccountResponse> {
  const baseUrl = getBaseManagerUrl();
  
  // 生成账户名称：legnext + email
  const accountName = `legnext_${params.email.replace('@', '_').replace(/\./g, '_')}`;
  
  // 映射前端plan到后端接受的plan值
  let backendPlan: string;
  switch (params.plan) {
    case "hobbyist":
      backendPlan = "hobbyist";
      break;
    case "premium":
      backendPlan = "premium"; 
      break;
    // 保持向后兼容性
    case "free":
      backendPlan = "hobbyist";
      break;
    case "pro":
      backendPlan = "premium";
      break;
    default:
      backendPlan = "hobbyist"; // 默认使用hobbyist计划
  }

  const requestData: BackendAccountRequest = {
    name: accountName,
    account_group: "user", // 普通用户组，根据您的需要可改为 "superadmin"
    type: "ppu", // pay per use 按使用付费
    plan: backendPlan,
    max_concurrent_task_count: (params.plan === "pro" || params.plan === "premium") ? 30 : 10, // 匹配示例中的并发数
    credit_remain: params.creditRemain || 100, // 默认100 credits
    mj_quota_remain: params.mjQuotaRemain || 100
  };

  console.log(`🔗 [DEBUG] Creating backend account for ${params.email} at ${baseUrl}`);
  console.log(`📤 [DEBUG] Request data:`, requestData);
  console.log(`🔍 [DEBUG] Full request details:`, {
    url: `${baseUrl}/api/account`,
    method: 'POST',
    headers: getAuthHeaders(),
    bodySize: JSON.stringify(requestData).length
  });

  try {
    const response = await fetch(`${baseUrl}/api/account`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData)
    });

    console.log(`📥 [DEBUG] Backend response:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [ERROR] Backend API error response:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result: BackendAccountResponse = await response.json();
    console.log(`📥 [DEBUG] Backend response data:`, result);
    
    // 检查响应格式
    if (result.code !== 200) {
      console.error(`❌ [ERROR] Backend API returned error code:`, result);
      throw new Error(`Backend API error: ${result.message || 'Unknown error'}`);
    }
    
    console.log(`✅ [SUCCESS] Backend account created successfully:`, result.data);
    
    return result;
  } catch (error) {
    console.error('❌ [ERROR] Failed to create backend account:', {
      error: error.message,
      stack: error.stack,
      params,
      baseUrl
    });
    throw error;
  }
}

// 获取后端账户信息
export async function getBackendAccount(accountId: number): Promise<BackendAccountResponse> {
  const baseUrl = getBaseManagerUrl();
  
  try {
    const response = await fetch(`${baseUrl}/api/account/${accountId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result: BackendAccountResponse = await response.json();
    
    // 检查响应格式
    if (result.code !== 200) {
      throw new Error(`Backend API error: ${result.message || 'Unknown error'}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to get backend account:', error);
    throw error;
  }
}

// 更新后端账户credits（使用实际API格式）
export async function updateBackendAccountCredits(params: {
  accountId: number;
  amount: number; // 要增加的credits数量（必须为正数）
  description?: string;
}): Promise<{ success: boolean; wallet?: any; error?: string }> {
  const baseUrl = getBaseManagerUrl();
  
  if (params.amount <= 0) {
    return {
      success: false,
      error: "Amount must be positive for credit addition"
    };
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/account/${params.accountId}/wallet/credit`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        type: "credit",
        amount: params.amount
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // 检查响应格式
    if (result.code !== 200) {
      throw new Error(`Backend API error: ${result.message || 'Unknown error'}`);
    }

    console.log(`✅ Backend account credits updated: +${params.amount} credits`);
    
    return {
      success: true,
      wallet: result.data
    };
  } catch (error) {
    console.error('❌ Failed to update backend account credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 生成用户API密钥名称
export function generateApiKeyName(email: string): string {
  return `legnext_${email.split('@')[0]}_key`;
}

// 创建API Key
export async function createBackendApiKey(params: {
  accountId: number;
  name?: string;
}): Promise<{ success: boolean; apiKey?: ApiKeyResponse; error?: string }> {
  const baseUrl = getBaseManagerUrl();
  
  try {
    const response = await fetch(`${baseUrl}/api/account/${params.accountId}/api_keys`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: params.name || 'Generated API Key'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // 检查响应格式
    if (result.code !== 200) {
      throw new Error(`Backend API error: ${result.message || 'Unknown error'}`);
    }
    
    console.log(`✅ API Key created successfully for account ${params.accountId}`);
    
    return { 
      success: true, 
      apiKey: result.data 
    };
  } catch (error) {
    console.error('❌ Failed to create API key:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// 获取账户的所有API Keys
export async function getBackendApiKeys(accountId: number): Promise<{ success: boolean; apiKeys?: ApiKeyResponse[]; error?: string }> {
  const baseUrl = getBaseManagerUrl();
  
  try {
    const response = await fetch(`${baseUrl}/api/account/${accountId}/api_keys`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // 检查响应格式
    if (result.code !== 200) {
      throw new Error(`Backend API error: ${result.message || 'Unknown error'}`);
    }
    
    // 确保data是数组
    const apiKeys = Array.isArray(result.data) ? result.data : [];
    
    console.log(`✅ Retrieved ${apiKeys.length} API keys for account ${accountId}`);
    
    return { 
      success: true, 
      apiKeys: apiKeys 
    };
  } catch (error) {
    console.error('❌ Failed to get API keys:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// 撤销API Key
export async function revokeBackendApiKey(params: {
  accountId: number;
  keyId: number;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const baseUrl = getBaseManagerUrl();
  
  try {
    const response = await fetch(`${baseUrl}/api/account/${params.accountId}/api_keys/${params.keyId}/revoke`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // 检查响应格式
    if (result.code !== 200) {
      throw new Error(`Backend API error: ${result.message || 'Unknown error'}`);
    }

    console.log(`✅ API Key ${params.keyId} revoked successfully: ${result.message}`);
    return { 
      success: true,
      message: result.message 
    };
  } catch (error) {
    console.error('❌ Failed to revoke API key:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// 获取钱包信息
export async function getBackendWallet(accountId: number): Promise<{ success: boolean; wallet?: any; error?: string }> {
  const baseUrl = getBaseManagerUrl();
  
  try {
    const response = await fetch(`${baseUrl}/api/account/${accountId}/wallet`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // 检查响应格式
    if (result.code !== 200) {
      throw new Error(`Backend API error: ${result.message || 'Unknown error'}`);
    }
    
    return { 
      success: true, 
      wallet: result.data 
    };
  } catch (error) {
    console.error('❌ Failed to get wallet info:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// 验证后端配置
export function validateBackendConfig(): { isValid: boolean; error?: string } {
  try {
    getBaseManagerUrl();
    getBackendApiKey();
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// 🎯 计算后端账户的可用credits余额
export function calculateAvailableCredits(wallet: any): number {
  console.log(`🔍 [DEBUG] calculateAvailableCredits called with:`, JSON.stringify(wallet, null, 2));
  
  if (!wallet) {
    console.log(`🔍 [DEBUG] Wallet is null/undefined`);
    return 0;
  }
  
  if (!wallet.credit_packs) {
    console.log(`🔍 [DEBUG] wallet.credit_packs is null/undefined`);
    return 0;
  }
  
  const creditPacks = Array.isArray(wallet.credit_packs) ? wallet.credit_packs : [];
  console.log(`🔍 [DEBUG] creditPacks array length: ${creditPacks.length}`);
  
  const totalCredits = creditPacks
    .filter((pack: any) => {
      const isActive = pack.active && !pack.deleted_at;
      console.log(`🔍 [DEBUG] Pack ${pack.id}: active=${pack.active}, deleted_at=${pack.deleted_at}, isActive=${isActive}`);
      return isActive;
    })
    .reduce((sum: number, pack: any) => {
      const available = (pack.capacity || 0) - (pack.used || 0);
      console.log(`🔍 [DEBUG] Pack ${pack.id}: capacity=${pack.capacity}, used=${pack.used}, available=${available}`);
      return sum + Math.max(0, available);
    }, 0);
    
  console.log(`🔍 [DEBUG] Total calculated credits: ${totalCredits}`);
  return totalCredits;
}