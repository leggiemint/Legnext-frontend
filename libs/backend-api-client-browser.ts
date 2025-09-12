/**
 * Browser-safe backend API client
 * Uses proxy routes to avoid client-side process.env issues
 */

import { BackendAccount, BackendApiResponse, TaskHistoryResponse, NotificationResponse, CreditPackInfo, BackendWallet, JobResponse } from './backend-api-client';

class BrowserBackendApiClient {
  /**
   * Get current account info using user's API key
   * This uses a proxy route to avoid client-side process.env issues
   */
  async getCurrentAccountInfo(userApiKey: string): Promise<BackendApiResponse<BackendAccount>> {
    const response = await fetch('/api/backend-proxy/account/info', {
      method: 'GET',
      headers: {
        'X-API-KEY': userApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get task histories - uses proxy route
   */
  async getTaskHistories(accountId: number, page = 1, pageSize = 10): Promise<BackendApiResponse<TaskHistoryResponse>> {
    const response = await fetch(`/api/backend-proxy/account/${accountId}/task_histories?page=${page}&page_size=${pageSize}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get notifications - uses proxy route
   */
  async getNotifications(accountId: number, page = 1, pageSize = 10): Promise<BackendApiResponse<NotificationResponse>> {
    const response = await fetch(`/api/backend-proxy/account/${accountId}/notifications?page=${page}&page_size=${pageSize}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Confirm notification - uses proxy route
   */
  async confirmNotification(accountId: number, notificationId: number): Promise<BackendApiResponse<{ message: string }>> {
    const response = await fetch(`/api/backend-proxy/account/${accountId}/notification/${notificationId}/confirm?page=1&page_size=null`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get credit packs - uses proxy route
   */
  async getCreditPacks(accountId: number): Promise<BackendApiResponse<CreditPackInfo>> {
    const response = await fetch(`/api/backend-proxy/account/${accountId}/wallet/credit_packs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Redeem code - uses proxy route
   */
  async redeemCode(userApiKey: string, code: string): Promise<BackendApiResponse<BackendWallet>> {
    const response = await fetch('/api/backend-proxy/account/code/retrieve', {
      method: 'POST',
      headers: {
        'X-API-KEY': userApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create diffusion task - uses proxy route
   */
  async createDiffusion(userApiKey: string, params: {
    text: string;
    callback?: string;
  }): Promise<JobResponse> {
    const response = await fetch('/api/backend-proxy/v1/diffusion', {
      method: 'POST',
      headers: {
        'X-API-KEY': userApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create upscale task - uses proxy route
   */
  async createUpscale(userApiKey: string, params: {
    jobId: string;
    imageNo: number;
    callback?: string;
  }): Promise<JobResponse> {
    const response = await fetch('/api/backend-proxy/v1/upscale', {
      method: 'POST',
      headers: {
        'X-API-KEY': userApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get job status - uses proxy route
   */
  async getJobStatus(userApiKey: string, jobId: string): Promise<JobResponse> {
    const response = await fetch(`/api/backend-proxy/v1/job/${jobId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': userApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const browserBackendApiClient = new BrowserBackendApiClient();