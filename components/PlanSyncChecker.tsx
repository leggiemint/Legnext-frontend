"use client";

import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useSession } from 'next-auth/react';

interface PlanSyncCheckerProps {
  // 可选的同步间隔时间（毫秒）
  syncInterval?: number;
  // 是否只在页面可见时同步
  syncOnlyWhenVisible?: boolean;
}

/**
 * 全局Plan同步检查组件
 * 负责定期从后端同步用户plan状态到前端缓存数据库
 * 确保整个应用的plan显示保持一致
 */
export default function PlanSyncChecker({ 
  syncInterval = 5 * 60 * 1000, // 默认5分钟同步一次
  syncOnlyWhenVisible = true 
}: PlanSyncCheckerProps): null {
  const sessionData = useSession();
  const session = sessionData?.data;
  const { user, refreshUserInfo, isLoading } = useUser();

  useEffect(() => {
    // 只有在用户登录时才进行同步
    if (!session?.user?.id || !user) {
      return;
    }


    // 立即进行一次同步检查
    const performSync = async () => {
      // 如果设置了只在页面可见时同步，检查页面可见性
      if (syncOnlyWhenVisible && document.hidden) {
        return;
      }

      // 如果正在加载中，跳过此次同步
      if (isLoading) {
        return;
      }

      try {
        await refreshUserInfo();
      } catch (error) {
        // Silently ignore sync errors to avoid interrupting user experience
      }
    };

    // 设置定期同步
    const syncTimer = setInterval(performSync, syncInterval);

    // 页面获得焦点时进行同步
    const handleVisibilityChange = () => {
      if (!document.hidden && syncOnlyWhenVisible) {
        performSync();
      }
    };

    // 添加页面可见性变化监听器
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 清理函数
    return () => {
      clearInterval(syncTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, user, refreshUserInfo, isLoading, syncInterval, syncOnlyWhenVisible]);

  // 监听支付相关的页面事件，触发立即同步
  useEffect(() => {
    const handlePaymentSuccess = () => {
      refreshUserInfo();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'payment_success' || e.key === 'subscription_updated') {
        refreshUserInfo();
      }
    };

    // 监听自定义事件
    window.addEventListener('payment_success', handlePaymentSuccess);
    window.addEventListener('subscription_updated', handlePaymentSuccess);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('payment_success', handlePaymentSuccess);
      window.removeEventListener('subscription_updated', handlePaymentSuccess);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshUserInfo]);

  // 这个组件不渲染任何UI，只负责后台同步
  return null;
}

// 便捷函数：触发手动同步（可以在其他组件中调用）
export function triggerPlanSync() {
  // 触发自定义事件来通知PlanSyncChecker进行同步
  window.dispatchEvent(new CustomEvent('subscription_updated'));
  
  // 也可以通过localStorage来通知
  localStorage.setItem('subscription_updated', Date.now().toString());
  setTimeout(() => {
    localStorage.removeItem('subscription_updated');
  }, 1000);
}