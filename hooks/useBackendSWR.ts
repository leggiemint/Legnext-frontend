import useSWR from 'swr';
import { BackendApiKey, BackendAccount, BackendWallet } from '@/libs/backend-api-client';

// Fetcher function for backend endpoints
const backendFetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  const data = await response.json();
  return data;
};

// Hook for fetching API keys
export function useBackendApiKeys() {
  const { data, error, mutate } = useSWR('/api/user/api-keys', backendFetcher);
  
  return {
    apiKeys: data?.data?.apiKeys || [],
    loading: !error && !data,
    error: error?.error || error?.message || (data?.data?.error),
    refresh: mutate,
  };
}

// Hook for fetching current account info
export function useBackendAccount() {
  const { data, error, mutate } = useSWR('/api/backend-proxy/account/info', backendFetcher);
  
  return {
    account: data?.data as BackendAccount,
    loading: !error && !data,
    error: error?.message || (data?.error),
    refresh: mutate,
  };
}

// Hook for fetching wallet info
export function useBackendWallet() {
  const { data, error, mutate } = useSWR('/api/credit-balance', backendFetcher);
  
  return {
    wallet: data as BackendWallet, // credit-balance API 直接返回数据，不包装在 data 字段中
    loading: !error && !data,
    error: error?.message || (data?.error),
    refresh: mutate,
  };
}