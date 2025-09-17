"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trackGetReditusConversion, waitForGetReditus } from '@/libs/getreditus';

/**
 * GetReditus 转化跟踪组件
 * 在用户首次登录时自动跟踪转化事件
 */
export default function GetReditusTracker(): null {
  const { data: session, status } = useSession();

  useEffect(() => {
    // 只在用户已认证且是首次登录时执行跟踪
    if (status === 'authenticated' && session?.user?.email) {
      const trackConversion = async () => {
        try {
          // 等待 GetReditus 脚本加载完成
          const isLoaded = await waitForGetReditus(10000); // 10秒超时
          
          if (isLoaded) {
            // 跟踪转化事件
            trackGetReditusConversion(session.user.email!);
          } else {
            console.warn('GetReditus script not loaded, conversion not tracked');
          }
        } catch (error) {
          console.error('GetReditus tracking error:', error);
        }
      };

      // 延迟执行以确保页面完全加载
      const timeoutId = setTimeout(trackConversion, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [status, session]);

  // 这个组件不渲染任何内容
  return null;
}
