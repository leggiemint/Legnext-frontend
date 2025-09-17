"use client";

import { useEffect, useState, ReactNode } from 'react';

interface NoSSRProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 防止服务器端渲染的组件包装器
 * 确保子组件只在客户端渲染，避免水合错误
 */
export default function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
