"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
  plan: string;
  subscriptionStatus: string;
  totalAvatarsCreated: number;
  preferences?: any;
  hasAccess?: boolean;
}

interface CreditsData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  dataSource: string;
  syncStatus?: {
    lastSyncedAt?: string;
    syncPerformed: boolean;
    backendAvailable: boolean;
  };
}

interface UserContextType {
  userData: UserData | null;
  credits: CreditsData | null;
  loading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
  isProUser: boolean;
  isFreeUser: boolean;
  hasActiveSubscription: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从后端同步用户数据到缓存数据库
  const fetchUserData = async () => {
    if (!session?.user?.id) {
      setUserData(null);
      setCredits(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/settings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 设置用户数据（从后端同步后的缓存数据）
      setUserData({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        image: data.user.image,
        plan: data.user.plan,
        subscriptionStatus: data.user.subscriptionStatus,
        totalAvatarsCreated: data.user.totalAvatarsCreated || 0,
        preferences: data.user.preferences,
        hasAccess: data.subscription?.isActive || data.user.plan === 'free'
      });

      // 设置credits数据
      setCredits({
        balance: data.credits.balance,
        totalEarned: data.credits.totalEarned,
        totalSpent: data.credits.totalSpent,
        dataSource: data.credits.dataSource,
        syncStatus: data.credits.syncStatus
      });

    } catch (err: any) {
      setError(err.message || 'Failed to fetch user data');
      
      // 错误时清空数据
      setUserData(null);
      setCredits(null);
    } finally {
      setLoading(false);
    }
  };

  // 当session变化时自动同步数据
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'authenticated' && session?.user?.id) {
      fetchUserData();
    } else {
      setUserData(null);
      setCredits(null);
    }
  }, [session, status]);

  // 计算用户状态
  const isProUser = userData?.plan === 'pro';
  const isFreeUser = userData?.plan === 'free';
  const hasActiveSubscription = userData?.subscriptionStatus === 'active' && isProUser;

  const contextValue: UserContextType = {
    userData,
    credits,
    loading,
    error,
    refreshUserData: fetchUserData,
    isProUser,
    isFreeUser, 
    hasActiveSubscription
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// 自定义hook来使用UserContext
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// 便捷的hooks
export function usePlan() {
  const { userData, isProUser, isFreeUser, hasActiveSubscription } = useUser();
  
  return {
    plan: userData?.plan || 'free',
    isProUser,
    isFreeUser,
    hasActiveSubscription,
    planDisplayName: isProUser ? 'Pro' : 'Free',
    canUseFeature: (feature: string) => {
      if (feature === 'basic') return true;
      if (feature === 'pro') return hasActiveSubscription;
      return false;
    }
  };
}

export function useCredits() {
  const { credits, refreshUserData } = useUser();
  
  return {
    balance: credits?.balance || 0,
    totalEarned: credits?.totalEarned || 0,
    totalSpent: credits?.totalSpent || 0,
    dataSource: credits?.dataSource || 'frontend',
    isBackendData: credits?.dataSource === 'backend',
    refreshCredits: refreshUserData,
    formatValue: (amount: number) => `$${(amount / 1000).toFixed(2)}`,
    syncStatus: credits?.syncStatus
  };
}