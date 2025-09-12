'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { browserBackendApiClient } from '@/libs/backend-api-client-browser';
import { BackendAccount, TaskHistoryResponse, NotificationResponse } from '@/libs/backend-api-client';

/**
 * Backend账户信息Hook
 */
export function useBackendAccount() {
  const { user } = useUser();
  const [account, setAccount] = useState<BackendAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    if (!user?.initApiKey) {
      setAccount(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await browserBackendApiClient.getCurrentAccountInfo(user.initApiKey);
      setAccount(response.data);
    } catch (err) {
      console.error('Error fetching backend account:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch account');
    } finally {
      setIsLoading(false);
    }
  }, [user?.initApiKey]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  return {
    account,
    isLoading,
    error,
    refetch: fetchAccount,
  };
}

/**
 * Backend任务历史Hook
 */
export function useBackendTaskHistories(page: number = 1, pageSize: number = 10) {
  const { user } = useUser();
  const [taskHistories, setTaskHistories] = useState<TaskHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskHistories = useCallback(async () => {
    if (!user?.backendAccountId) {
      setTaskHistories(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await browserBackendApiClient.getTaskHistories(
        user.backendAccountId,
        page,
        pageSize
      );
      setTaskHistories(response.data);
    } catch (err) {
      console.error('Error fetching task histories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch task histories');
    } finally {
      setIsLoading(false);
    }
  }, [user?.backendAccountId, page, pageSize]);

  useEffect(() => {
    fetchTaskHistories();
  }, [fetchTaskHistories]);

  return {
    taskHistories: taskHistories?.data || [],
    pagination: {
      page: taskHistories?.page || 1,
      size: taskHistories?.size || pageSize,
      total: taskHistories?.total || 0,
    },
    isLoading,
    error,
    refetch: fetchTaskHistories,
  };
}

/**
 * Backend通知Hook
 */
export function useBackendNotifications(page: number = 1, pageSize: number = 10) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.backendAccountId) {
      setNotifications(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await browserBackendApiClient.getNotifications(
        user.backendAccountId,
        page,
        pageSize
      );
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.backendAccountId, page, pageSize]);

  const confirmNotification = useCallback(async (notificationId: number) => {
    if (!user?.backendAccountId) return false;

    try {
      await browserBackendApiClient.confirmNotification(user.backendAccountId, notificationId);
      // 刷新通知列表
      fetchNotifications();
      return true;
    } catch (err) {
      console.error('Error confirming notification:', err);
      return false;
    }
  }, [user?.backendAccountId, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications: notifications?.data || [],
    pagination: {
      page: notifications?.page || 1,
      size: notifications?.size || pageSize,
      total: notifications?.total || 0,
    },
    isLoading,
    error,
    refetch: fetchNotifications,
    confirmNotification,
  };
}

/**
 * Backend信用包详情Hook
 */
export function useBackendCreditPacks() {
  const { user } = useUser();
  const [creditPacks, setCreditPacks] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditPacks = useCallback(async () => {
    if (!user?.backendAccountId) {
      setCreditPacks(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await browserBackendApiClient.getCreditPacks(user.backendAccountId);
      setCreditPacks(response.data);
    } catch (err) {
      console.error('Error fetching credit packs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credit packs');
    } finally {
      setIsLoading(false);
    }
  }, [user?.backendAccountId]);

  useEffect(() => {
    fetchCreditPacks();
  }, [fetchCreditPacks]);

  return {
    creditPacks: creditPacks?.credit_packs || [],
    summary: {
      total_credits: creditPacks?.total_credits || 0,
      available_credits: creditPacks?.available_credits || 0,
      frozen_credits: creditPacks?.frozen_credits || 0,
      used_credits: creditPacks?.used_credits || 0,
      expired_credits: creditPacks?.expired_credits || 0,
    },
    isLoading,
    error,
    refetch: fetchCreditPacks,
  };
}

/**
 * 兑换码Hook
 */
export function useRedeemCode() {
  const { user } = useUser();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeemCode = useCallback(async (code: string) => {
    if (!user?.initApiKey) {
      throw new Error('User API key not available');
    }

    try {
      setIsRedeeming(true);
      setError(null);

      const response = await browserBackendApiClient.redeemCode(user.initApiKey, code);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to redeem code';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsRedeeming(false);
    }
  }, [user?.initApiKey]);

  return {
    redeemCode,
    isRedeeming,
    error,
  };
}