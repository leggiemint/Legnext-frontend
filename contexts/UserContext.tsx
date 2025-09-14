'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { browserBackendApiClient } from '@/libs/backend-api-client-browser';
import { BackendAccount } from '@/libs/backend-api-client';

// 用户基础信息接口
export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: 'free' | 'pro';
  backendAccountId: number | null;
  initApiKey: string | null;
  subscriptionId: string | null; // Stripe订阅ID
}

// Balance信息接口
export interface BalanceInfo {
  // 原始数据
  remainingCredits: number;    // 剩余credits
  remainingPoints: number;     // 剩余points
  frozenCredits: number;       // 冻结的credits
  frozenPoints: number;        // 冻结的points
  usedCredits: number;         // 已使用credits
  usedPoints: number;          // 已使用points
  
  // 计算后的余额 (单位：美元)
  totalBalance: number;        // 总余额 = (remainingCredits + remainingPoints) / 1000
  availableBalance: number;    // 可用余额 = (remainingCredits + remainingPoints - frozenCredits - frozenPoints) / 1000
  
  // 信用包详情
  creditPacks: CreditPackInfo[];
}

// 信用包信息
export interface CreditPackInfo {
  id: number;
  capacity: number;
  used: number;
  remaining: number;
  frozen: number;
  description: string;
  expired_at: string;
  active: boolean;
}

// Context状态接口
interface UserContextState {
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

const UserContext = createContext<UserContextState | undefined>(undefined);

// Balance计算辅助函数
export function calculateBalance(backendAccount: BackendAccount): BalanceInfo {
  const wallet = backendAccount.wallet;
  const creditPackInfo = backendAccount.credit_pack_info;
  
  if (!wallet || !creditPackInfo) {
    return {
      remainingCredits: 0,
      remainingPoints: 0,
      frozenCredits: 0,
      frozenPoints: 0,
      usedCredits: 0,
      usedPoints: 0,
      totalBalance: 0,
      availableBalance: 0,
      creditPacks: [],
    };
  }

  // 从信用包计算credits相关数据
  const remainingCredits = creditPackInfo.available_credits || 0;
  const frozenCredits = creditPackInfo.frozen_credits || 0;
  const usedCredits = creditPackInfo.used_credits || 0;
  
  // 从钱包获取points相关数据
  const remainingPoints = wallet.point_remain || 0;
  const frozenPoints = wallet.point_frozen || 0;
  const usedPoints = wallet.point_used || 0;
  
  // 计算总余额和可用余额 (1$ = 1000 credits/points)
  const totalBalance = (remainingCredits + remainingPoints) / 1000;
  const availableBalance = (remainingCredits + remainingPoints - frozenCredits - frozenPoints) / 1000;
  
  // 格式化信用包信息
  const creditPacks: CreditPackInfo[] = creditPackInfo.credit_packs?.map(pack => ({
    id: pack.id,
    capacity: pack.capacity,
    used: pack.used,
    remaining: pack.capacity - pack.used,
    frozen: pack.frozen,
    description: pack.description,
    expired_at: pack.expired_at,
    active: pack.active,
  })) || [];

  return {
    remainingCredits,
    remainingPoints,
    frozenCredits,
    frozenPoints,
    usedCredits,
    usedPoints,
    totalBalance,
    availableBalance,
    creditPacks,
  };
}

// UserContext Provider组件
export function UserContextProvider({ children }: { children: React.ReactNode }) {
  const sessionResponse = useSession();
  const session = sessionResponse?.data;
  const status = sessionResponse?.status;
  const [user, setUser] = useState<UserInfo | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户基础信息
  const refreshUserInfo = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 从前端数据库获取用户信息
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = await response.json();
      
      setUser({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
        image: session.user.image,
        plan: userData.profile?.plan || 'free',
        backendAccountId: userData.profile?.backendAccountId || null,
        initApiKey: userData.profile?.initApiKey || userData.profile?.preferences?.initApiKey || null,
        subscriptionId: userData.profile?.subscriptionId || null,
      });

    } catch (err) {
      console.error('Error fetching user info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user info');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  // 获取Balance信息
  const refreshBalance = useCallback(async () => {
    if (!user?.initApiKey) {
      setBalance(null);
      return;
    }

    try {
      setIsBalanceLoading(true);
      setError(null);

      // 从Backend系统获取账户信息
      const backendAccount = await browserBackendApiClient.getCurrentAccountInfo(user.initApiKey);
      
      // 计算balance信息
      const balanceInfo = calculateBalance(backendAccount.data);
      setBalance(balanceInfo);

    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      setBalance(null);
    } finally {
      setIsBalanceLoading(false);
    }
  }, [user?.initApiKey]);

  // 刷新所有数据
  const refreshAll = useCallback(async () => {
    await refreshUserInfo();
    // refreshBalance会在user更新后自动触发
  }, [refreshUserInfo]);

  // 当session状态变化时，获取用户信息
  useEffect(() => {
    if (status === 'authenticated') {
      refreshUserInfo();
    } else if (status === 'unauthenticated') {
      setUser(null);
      setBalance(null);
      setIsLoading(false);
    }
  }, [status, refreshUserInfo]);

  // 当用户信息变化时，获取balance信息
  useEffect(() => {
    if (user?.initApiKey) {
      refreshBalance();
    } else {
      setBalance(null);
    }
  }, [user?.initApiKey, refreshBalance]);

  // 定时刷新balance数据 (每30秒)
  useEffect(() => {
    if (!user?.initApiKey) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 30000); // 30秒

    return () => clearInterval(interval);
  }, [user?.initApiKey, refreshBalance]);

  const contextValue: UserContextState = {
    user,
    balance,
    isLoading,
    isBalanceLoading,
    error,
    refreshUserInfo,
    refreshBalance,
    refreshAll,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// useUser hook
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    // During SSR, return safe defaults instead of throwing
    if (typeof window === 'undefined') {
      return {
        user: null as UserInfo | null,
        balance: null as BalanceInfo | null,
        isLoading: true,
        isBalanceLoading: false,
        error: null as string | null,
        refreshUserInfo: () => Promise.resolve(),
        refreshBalance: () => Promise.resolve(),
        refreshAll: () => Promise.resolve()
      };
    }
    throw new Error('useUser must be used within a UserContextProvider');
  }
  return context;
}

// 便捷hooks
export function useUserInfo() {
  const { user, isLoading, error } = useUser();
  return { user, isLoading, error };
}

export function useBalance() {
  const { balance, isBalanceLoading, error } = useUser();
  return { balance, isLoading: isBalanceLoading, error };
}

export function useUserPlan() {
  const { user } = useUser();
  return user?.plan || 'free';
}

// Balance格式化辅助函数
export function formatBalance(balance: number): string {
  return `$${balance.toFixed(2)}`;
}

export function formatCredits(credits: number): string {
  return `${credits.toLocaleString()} credits`;
}

export function formatPoints(points: number): string {
  return `${points.toLocaleString()} points`;
}