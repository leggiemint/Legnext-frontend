"use client";

import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import { useSession } from 'next-auth/react';
import { waitForGetReditus } from '@/libs/getreditus';
import config from '@/config';

interface ReferralWidgetProps {
  className?: string;
}

interface AuthTokenResponse {
  auth_token: string;
  product_id: string;
}

/**
 * GetReditus 推荐小部件组件
 * 自动加载并显示推荐小部件
 */
export default function GetReditusReferralWidget({ className = "" }: ReferralWidgetProps): JSX.Element | null {
  const { data: session, status } = useSession();
  const sessionUser = session?.user;
  const sessionEmail = sessionUser?.email;
  const sessionName = sessionUser?.name;
  const sessionId = sessionUser?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const loadReferralWidget = useCallback(async () => {
    if (widgetLoaded || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // 检查配置
      if (!config.getreditus?.enabled) {
        throw new Error('GetReditus is not enabled in configuration');
      }

      // 等待 GetReditus 脚本加载完成
      const isGetReditusLoaded = await waitForGetReditus(10000);
      if (!isGetReditusLoaded) {
        throw new Error('GetReditus script not loaded within timeout');
      }

      // 获取认证令牌
      const authResponse = await fetch('/api/getreditus/auth-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.error || 'Failed to get auth token');
      }

      const { auth_token, product_id }: AuthTokenResponse = await authResponse.json();

      // 准备用户详细信息 - 根据官方文档格式
      if (!sessionEmail) {
        throw new Error('User session missing email');
      }

      const userDetails = {
        email: sessionEmail,
        first_name: sessionName?.split(' ')[0] || '',
        last_name: sessionName?.split(' ').slice(1).join(' ') || '',
        company_id: sessionId, // 使用用户ID作为公司ID
        company_name: 'Legnext User',
      };

      // 调用 GetReditus 加载推荐小部件
      if (typeof window !== 'undefined' && window.gr) {
        window.gr('loadReferralWidget', {
          product_id,
          auth_token,
          user_details: userDetails,
        });

        // 等待推荐小部件初始化，使用轮询检查
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = 500; // 每500ms检查一次

        const checkWidget = () => {
          attempts++;
          
          if (window.referralWidget && typeof window.referralWidget.show === 'function') {
            setWidgetLoaded(true);
            return;
          }
          
          if (attempts < maxAttempts) {
            setTimeout(checkWidget, checkInterval);
          }
        };

        // 开始检查
        setTimeout(checkWidget, 100);

      } else {
        throw new Error('GetReditus gr function not available');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('GetReditus referral widget loading error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [widgetLoaded, isLoading, sessionEmail, sessionName, sessionId]);

  useEffect(() => {
    // 只在用户已认证且 GetReditus 启用时执行
    if (status === 'authenticated' && sessionEmail && config.getreditus?.enabled) {
      void loadReferralWidget();
    }
  }, [status, sessionEmail, loadReferralWidget]);

  // 添加全局监听器来检测推荐小部件何时可用
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkForWidget = () => {
      if (window.referralWidget && typeof window.referralWidget.show === 'function') {
        setWidgetLoaded(true);
      }
    };

    // 定期检查推荐小部件是否可用
    const interval = setInterval(checkForWidget, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // 如果 GetReditus 未启用，不显示组件
  if (!config.getreditus?.enabled) {
    return null;
  }

  // 如果用户未认证，不显示组件
  if (status !== 'authenticated' || !session?.user?.email) {
    return null;
  }

  return (
    <div className={`getreditus-referral-widget ${className}`}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            Failed to load referral widget: {error}
          </p>
          <button
            onClick={() => void loadReferralWidget()}
            className="mt-2 text-sm text-red-700 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
